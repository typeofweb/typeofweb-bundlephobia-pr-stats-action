import { join } from 'path';

import type * as tofw from '@typeofweb/schema';
import Benchmarkify from 'benchmarkify';
import Joi from 'joi';
import shuffle from 'lodash.shuffle';
import * as superstruct from 'superstruct';
import * as yup from 'yup';

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

  function typeofweb__schemaSuite({
    prDirectory,
    baseDirectory,
  }: {
    readonly prDirectory: string;
    readonly baseDirectory: string;
  }) {
    [prDirectory, baseDirectory].forEach((path) => {
      const typeofwebSchema = require(path) as typeof tofw;
      const schema = typeofwebSchema.object({
        name: typeofwebSchema.minLength(4)(typeofwebSchema.string()),
        email: typeofwebSchema.string(),
        firstName: typeofwebSchema.nonEmpty(typeofwebSchema.string()),
        phone: typeofwebSchema.nonEmpty(typeofwebSchema.string()),
        age: typeofwebSchema.number(),
      });
      const validator = typeofwebSchema.validate(schema);
      bench.ref(`@typeofweb/schema@${path}`, () => {
        return validator(obj);
      });
    });
  },
];

export function runSpeedtest({
  prDirectory,
  baseDirectory,
}: {
  readonly prDirectory: string;
  readonly baseDirectory: string;
}) {
  const cwd = process.cwd();
  shuffle(cases).map((c) =>
    c({
      prDirectory: join(cwd, prDirectory),
      baseDirectory: join(cwd, baseDirectory),
    }),
  );
  return bench.run();
}
