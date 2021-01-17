import { join } from 'path';

import type * as tofw from '@typeofweb/schema';
import Benchmarkify from 'benchmarkify';
import Joi from 'joi';
import shuffle from 'lodash.shuffle';
import * as superstruct from 'superstruct';
import * as yup from 'yup';
import * as zod from 'zod';

import pkg from '../package.json';

const benchmark = new Benchmarkify('Validators benchmark').printHeader();
const bench = benchmark.createSuite('Simple object');

const obj = {
  name: 'John Doe',
  email: 'john.doe@company.space',
  firstName: 'John',
  phone: '123-4567',
  age: 33,
};

const cases = [
  function joiSuite() {
    const version = pkg.dependencies['joi'];

    const schema = Joi.object().keys({
      name: Joi.string().min(4).max(25).required(),
      email: Joi.string().email().required(),
      firstName: Joi.required(),
      phone: Joi.required(),
      age: Joi.number().integer().min(18).required(),
    });

    bench.add(`joi@${version}`, () => {
      return schema.validate(obj);
    });
  },

  function yupSuite() {
    const version = pkg.dependencies['yup'];

    const schema = yup.object().shape({
      name: yup.string().min(4).max(25).required(),
      email: yup.string().email().required(),
      firstName: yup.mixed().required(),
      phone: yup.mixed().required(),
      age: yup.number().integer().min(18).required(),
    });

    bench.add(`yup@${version}`, () => {
      return schema.validateSync(obj);
    });
  },

  function superstructSuite() {
    const version = pkg.dependencies['superstruct'];

    const validator = superstruct.object({
      name: superstruct.size(superstruct.string(), 4, 25),
      email: superstruct.string(),
      firstName: superstruct.size(superstruct.string(), 1),
      phone: superstruct.size(superstruct.string(), 1),
      age: superstruct.size(superstruct.integer(), 18),
    });

    bench.add(`superstruct@${version}`, () => {
      validator.validate(obj);
    });
  },

  function zodSuite() {
    const version = pkg.dependencies['zod'];

    const schema = zod.object({
      name: zod.string().min(4).max(25),
      email: zod.string().nonempty().email(),
      firstName: zod.any(),
      phone: zod.any(),
      age: zod.number().int().min(18),
    });

    bench.add(`zod@${version}`, () => {
      return schema.parse(obj);
    });
  },

  function typeofweb__schemaSuite({
    prDirectory,
    baseDirectory,
  }: {
    readonly prDirectory: string;
    readonly baseDirectory: string;
  }) {
    const cwd = process.cwd();
    [prDirectory, baseDirectory].forEach((path) => {
      const typeofwebSchema = require(join(cwd, path)) as typeof tofw;
      const schema = typeofwebSchema.object({
        name: typeofwebSchema.minLength(4)(typeofwebSchema.string()),
        email: typeofwebSchema.string(),
        firstName: typeofwebSchema.nonEmpty(typeofwebSchema.string()),
        phone: typeofwebSchema.nonEmpty(typeofwebSchema.string()),
        age: typeofwebSchema.number(),
      });
      const validator = typeofwebSchema.validate(schema);
      if (path === baseDirectory) {
        bench.ref(`@typeofweb/schema@${path}`, () => {
          return validator(obj);
        });
      } else {
        bench.add(`@typeofweb/schema@${path}`, () => {
          return validator(obj);
        });
      }
    });
  },
];

export async function runSpeedtest({
  prDirectory,
  baseDirectory,
}: {
  readonly prDirectory: string;
  readonly baseDirectory: string;
}) {
  shuffle(cases).map((c) =>
    c({
      prDirectory,
      baseDirectory,
    }),
  );
  const results = await bench.run();

  return {
    prSpeed: results.filter(
      (val) => !val.name.includes('@typeofweb/schema') || !val.name.includes(baseDirectory),
    ),
    baseSpeed: results.filter(
      (val) => !val.name.includes('@typeofweb/schema') || !val.name.includes(prDirectory),
    ),
  };
}
