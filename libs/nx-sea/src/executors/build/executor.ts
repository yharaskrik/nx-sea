import { SeaBuildExecutorSchema } from './schema';
import { join } from 'path';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { writeFileSync, readFileSync, rmdirSync, mkdirSync } from 'fs';
import * as postject from 'postject';
import { type } from 'os';

import run from 'nx/src/executors/run-commands/run-commands.impl';
import { logger } from 'nx/src/utils/logger';

async function removeSignature(
  seaPath: string,
  options: SeaBuildExecutorSchema,
  context: ExecutorContext
) {
  logger.log(`Removing signature from binary.`);

  if (type() === 'Windows_NT' && options.removeSignature) {
    await run(
      {
        __unparsed__: [],
        command: `signtool remove /s ${options.entryPoint}`,
        cwd: seaPath,
      },
      context
    );
  } else if (type() === 'Darwin') {
    await run(
      {
        __unparsed__: [],
        command: `codesign --sign - ${options.entryPoint}`,
        cwd: seaPath,
      },
      context
    );
  }
}

async function injectBlob(
  seaPath: string,
  blob: string,
  options: SeaBuildExecutorSchema
) {
  logger.log(`Injecting blob into Node binary.`);

  await postject.inject(
    join(seaPath, options.entryPoint),
    'NODE_SEA_BLOB',
    readFileSync(join(seaPath, blob)),
    {
      sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
      machoSegmentName: type() === 'Darwin' ? 'NODE_SEA' : undefined,
    }
  );
}

export default async function runExecutor(
  options: SeaBuildExecutorSchema,
  context: ExecutorContext
) {
  const buildPath = join(context.cwd, options.directory);

  const seaPath = join(buildPath, 'sea');

  try {
    rmdirSync(seaPath);
  } catch (e) {
    //
  }

  mkdirSync(seaPath);

  const entryPoint = `${options.entryPoint}.js`;

  const blob = `${options.entryPoint}.blob`;

  logger.log(`Creating sea-config.json`);

  writeFileSync(
    join(seaPath, 'sea-config.json'),
    JSON.stringify({ main: `../${entryPoint}`, output: blob })
  );

  logger.log(`Generating blob with SEA config.`);

  await run(
    {
      __unparsed__: [],
      command: `node --experimental-sea-config sea-config.json`,
      cwd: seaPath,
    },
    context
  );

  logger.log(`Copying Node binary to dist.`);

  await run(
    {
      __unparsed__: [],
      command: `cp $(command -v ${options.nodePath ?? 'node'}) ${
        options.entryPoint
      }`,
      cwd: seaPath,
    },
    context
  );

  await injectBlob(seaPath, blob, options);

  await removeSignature(seaPath, options, context);

  return {
    success: true,
  };
}
