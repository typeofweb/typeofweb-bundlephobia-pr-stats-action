module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 35:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var KEYWORDS = __webpack_require__(2197);

module.exports = defineKeywords;


/**
 * Defines one or several keywords in ajv instance
 * @param  {Ajv} ajv validator instance
 * @param  {String|Array<String>|undefined} keyword keyword(s) to define
 * @return {Ajv} ajv instance (for chaining)
 */
function defineKeywords(ajv, keyword) {
  if (Array.isArray(keyword)) {
    for (var i=0; i<keyword.length; i++)
      get(keyword[i])(ajv);
    return ajv;
  }
  if (keyword) {
    get(keyword)(ajv);
    return ajv;
  }
  for (keyword in KEYWORDS) get(keyword)(ajv);
  return ajv;
}


defineKeywords.get = get;

function get(keyword) {
  var defFunc = KEYWORDS[keyword];
  if (!defFunc) throw new Error('Unknown keyword ' + keyword);
  return defFunc;
}


/***/ }),

/***/ 315:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d:\d\d)?$/i;
var DATE_TIME_SEPARATOR = /t|\s/i;

var COMPARE_FORMATS = {
  date: compareDate,
  time: compareTime,
  'date-time': compareDateTime
};

var $dataMetaSchema = {
  type: 'object',
  required: [ '$data' ],
  properties: {
    $data: {
      type: 'string',
      anyOf: [
        { format: 'relative-json-pointer' },
        { format: 'json-pointer' }
      ]
    }
  },
  additionalProperties: false
};

module.exports = function (minMax) {
  var keyword = 'format' + minMax;
  return function defFunc(ajv) {
    defFunc.definition = {
      type: 'string',
      inline: __webpack_require__(8666),
      statements: true,
      errors: 'full',
      dependencies: ['format'],
      metaSchema: {
        anyOf: [
          {type: 'string'},
          $dataMetaSchema
        ]
      }
    };

    ajv.addKeyword(keyword, defFunc.definition);
    ajv.addKeyword('formatExclusive' + minMax, {
      dependencies: ['format' + minMax],
      metaSchema: {
        anyOf: [
          {type: 'boolean'},
          $dataMetaSchema
        ]
      }
    });
    extendFormats(ajv);
    return ajv;
  };
};


function extendFormats(ajv) {
  var formats = ajv._formats;
  for (var name in COMPARE_FORMATS) {
    var format = formats[name];
    // the last condition is needed if it's RegExp from another window
    if (typeof format != 'object' || format instanceof RegExp || !format.validate)
      format = formats[name] = { validate: format };
    if (!format.compare)
      format.compare = COMPARE_FORMATS[name];
  }
}


function compareDate(d1, d2) {
  if (!(d1 && d2)) return;
  if (d1 > d2) return 1;
  if (d1 < d2) return -1;
  if (d1 === d2) return 0;
}


function compareTime(t1, t2) {
  if (!(t1 && t2)) return;
  t1 = t1.match(TIME);
  t2 = t2.match(TIME);
  if (!(t1 && t2)) return;
  t1 = t1[1] + t1[2] + t1[3] + (t1[4]||'');
  t2 = t2[1] + t2[2] + t2[3] + (t2[4]||'');
  if (t1 > t2) return 1;
  if (t1 < t2) return -1;
  if (t1 === t2) return 0;
}


function compareDateTime(dt1, dt2) {
  if (!(dt1 && dt2)) return;
  dt1 = dt1.split(DATE_TIME_SEPARATOR);
  dt2 = dt2.split(DATE_TIME_SEPARATOR);
  var res = compareDate(dt1[0], dt2[0]);
  if (res === undefined) return;
  return res || compareTime(dt1[1], dt2[1]);
}


/***/ }),

/***/ 221:
/***/ ((module) => {

"use strict";


module.exports = {
  metaSchemaRef: metaSchemaRef
};

var META_SCHEMA_ID = 'http://json-schema.org/draft-07/schema';

function metaSchemaRef(ajv) {
  var defaultMeta = ajv._opts.defaultMeta;
  if (typeof defaultMeta == 'string') return { $ref: defaultMeta };
  if (ajv.getSchema(META_SCHEMA_ID)) return { $ref: META_SCHEMA_ID };
  console.warn('meta schema not defined');
  return {};
}


/***/ }),

/***/ 7321:
/***/ ((module) => {

"use strict";


module.exports = function defFunc(ajv) {
  defFunc.definition = {
    type: 'object',
    macro: function (schema, parentSchema) {
      if (!schema) return true;
      var properties = Object.keys(parentSchema.properties);
      if (properties.length == 0) return true;
      return {required: properties};
    },
    metaSchema: {type: 'boolean'},
    dependencies: ['properties']
  };

  ajv.addKeyword('allRequired', defFunc.definition);
  return ajv;
};


/***/ }),

/***/ 8268:
/***/ ((module) => {

"use strict";


module.exports = function defFunc(ajv) {
  defFunc.definition = {
    type: 'object',
    macro: function (schema) {
      if (schema.length == 0) return true;
      if (schema.length == 1) return {required: schema};
      var schemas = schema.map(function (prop) {
        return {required: [prop]};
      });
      return {anyOf: schemas};
    },
    metaSchema: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  };

  ajv.addKeyword('anyRequired', defFunc.definition);
  return ajv;
};


/***/ }),

/***/ 9007:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var util = __webpack_require__(221);

module.exports = function defFunc(ajv) {
  defFunc.definition = {
    type: 'object',
    macro: function (schema) {
      var schemas = [];
      for (var pointer in schema)
        schemas.push(getSchema(pointer, schema[pointer]));
      return {'allOf': schemas};
    },
    metaSchema: {
      type: 'object',
      propertyNames: {
        type: 'string',
        format: 'json-pointer'
      },
      additionalProperties: util.metaSchemaRef(ajv)
    }
  };

  ajv.addKeyword('deepProperties', defFunc.definition);
  return ajv;
};


function getSchema(jsonPointer, schema) {
  var segments = jsonPointer.split('/');
  var rootSchema = {};
  var pointerSchema = rootSchema;
  for (var i=1; i<segments.length; i++) {
    var segment = segments[i];
    var isLast = i == segments.length - 1;
    segment = unescapeJsonPointer(segment);
    var properties = pointerSchema.properties = {};
    var items = undefined;
    if (/[0-9]+/.test(segment)) {
      var count = +segment;
      items = pointerSchema.items = [];
      while (count--) items.push({});
    }
    pointerSchema = isLast ? schema : {};
    properties[segment] = pointerSchema;
    if (items) items.push(pointerSchema);
  }
  return rootSchema;
}


function unescapeJsonPointer(str) {
  return str.replace(/~1/g, '/').replace(/~0/g, '~');
}


/***/ }),

/***/ 6452:
/***/ ((module) => {

"use strict";


module.exports = function defFunc(ajv) {
  defFunc.definition = {
    type: 'object',
    inline: function (it, keyword, schema) {
      var expr = '';
      for (var i=0; i<schema.length; i++) {
        if (i) expr += ' && ';
        expr += '(' + getData(schema[i], it.dataLevel) + ' !== undefined)';
      }
      return expr;
    },
    metaSchema: {
      type: 'array',
      items: {
        type: 'string',
        format: 'json-pointer'
      }
    }
  };

  ajv.addKeyword('deepRequired', defFunc.definition);
  return ajv;
};


function getData(jsonPointer, lvl) {
  var data = 'data' + (lvl || '');
  if (!jsonPointer) return data;

  var expr = data;
  var segments = jsonPointer.split('/');
  for (var i=1; i<segments.length; i++) {
    var segment = segments[i];
    data += getProperty(unescapeJsonPointer(segment));
    expr += ' && ' + data;
  }
  return expr;
}


var IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
var INTEGER = /^[0-9]+$/;
var SINGLE_QUOTE = /'|\\/g;
function getProperty(key) {
  return INTEGER.test(key)
          ? '[' + key + ']'
          : IDENTIFIER.test(key)
            ? '.' + key
            : "['" + key.replace(SINGLE_QUOTE, '\\$&') + "']";
}


function unescapeJsonPointer(str) {
  return str.replace(/~1/g, '/').replace(/~0/g, '~');
}


/***/ }),

/***/ 8666:
/***/ ((module) => {

"use strict";

module.exports = function generate__formatLimit(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  out += 'var ' + ($valid) + ' = undefined;';
  if (it.opts.format === false) {
    out += ' ' + ($valid) + ' = true; ';
    return out;
  }
  var $schemaFormat = it.schema.format,
    $isDataFormat = it.opts.$data && $schemaFormat.$data,
    $closingBraces = '';
  if ($isDataFormat) {
    var $schemaValueFormat = it.util.getData($schemaFormat.$data, $dataLvl, it.dataPathArr),
      $format = 'format' + $lvl,
      $compare = 'compare' + $lvl;
    out += ' var ' + ($format) + ' = formats[' + ($schemaValueFormat) + '] , ' + ($compare) + ' = ' + ($format) + ' && ' + ($format) + '.compare;';
  } else {
    var $format = it.formats[$schemaFormat];
    if (!($format && $format.compare)) {
      out += '  ' + ($valid) + ' = true; ';
      return out;
    }
    var $compare = 'formats' + it.util.getProperty($schemaFormat) + '.compare';
  }
  var $isMax = $keyword == 'formatMaximum',
    $exclusiveKeyword = 'formatExclusive' + ($isMax ? 'Maximum' : 'Minimum'),
    $schemaExcl = it.schema[$exclusiveKeyword],
    $isDataExcl = it.opts.$data && $schemaExcl && $schemaExcl.$data,
    $op = $isMax ? '<' : '>',
    $result = 'result' + $lvl;
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if ($isDataExcl) {
    var $schemaValueExcl = it.util.getData($schemaExcl.$data, $dataLvl, it.dataPathArr),
      $exclusive = 'exclusive' + $lvl,
      $opExpr = 'op' + $lvl,
      $opStr = '\' + ' + $opExpr + ' + \'';
    out += ' var schemaExcl' + ($lvl) + ' = ' + ($schemaValueExcl) + '; ';
    $schemaValueExcl = 'schemaExcl' + $lvl;
    out += ' if (typeof ' + ($schemaValueExcl) + ' != \'boolean\' && ' + ($schemaValueExcl) + ' !== undefined) { ' + ($valid) + ' = false; ';
    var $errorKeyword = $exclusiveKeyword;
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = ''; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ($errorKeyword || '_formatExclusiveLimit') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
      if (it.opts.messages !== false) {
        out += ' , message: \'' + ($exclusiveKeyword) + ' should be boolean\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    var __err = out;
    out = $$outStack.pop();
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError([' + (__err) + ']); ';
      } else {
        out += ' validate.errors = [' + (__err) + ']; return false; ';
      }
    } else {
      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    out += ' }  ';
    if ($breakOnError) {
      $closingBraces += '}';
      out += ' else { ';
    }
    if ($isData) {
      out += ' if (' + ($schemaValue) + ' === undefined) ' + ($valid) + ' = true; else if (typeof ' + ($schemaValue) + ' != \'string\') ' + ($valid) + ' = false; else { ';
      $closingBraces += '}';
    }
    if ($isDataFormat) {
      out += ' if (!' + ($compare) + ') ' + ($valid) + ' = true; else { ';
      $closingBraces += '}';
    }
    out += ' var ' + ($result) + ' = ' + ($compare) + '(' + ($data) + ',  ';
    if ($isData) {
      out += '' + ($schemaValue);
    } else {
      out += '' + (it.util.toQuotedString($schema));
    }
    out += ' ); if (' + ($result) + ' === undefined) ' + ($valid) + ' = false; var ' + ($exclusive) + ' = ' + ($schemaValueExcl) + ' === true; if (' + ($valid) + ' === undefined) { ' + ($valid) + ' = ' + ($exclusive) + ' ? ' + ($result) + ' ' + ($op) + ' 0 : ' + ($result) + ' ' + ($op) + '= 0; } if (!' + ($valid) + ') var op' + ($lvl) + ' = ' + ($exclusive) + ' ? \'' + ($op) + '\' : \'' + ($op) + '=\';';
  } else {
    var $exclusive = $schemaExcl === true,
      $opStr = $op;
    if (!$exclusive) $opStr += '=';
    var $opExpr = '\'' + $opStr + '\'';
    if ($isData) {
      out += ' if (' + ($schemaValue) + ' === undefined) ' + ($valid) + ' = true; else if (typeof ' + ($schemaValue) + ' != \'string\') ' + ($valid) + ' = false; else { ';
      $closingBraces += '}';
    }
    if ($isDataFormat) {
      out += ' if (!' + ($compare) + ') ' + ($valid) + ' = true; else { ';
      $closingBraces += '}';
    }
    out += ' var ' + ($result) + ' = ' + ($compare) + '(' + ($data) + ',  ';
    if ($isData) {
      out += '' + ($schemaValue);
    } else {
      out += '' + (it.util.toQuotedString($schema));
    }
    out += ' ); if (' + ($result) + ' === undefined) ' + ($valid) + ' = false; if (' + ($valid) + ' === undefined) ' + ($valid) + ' = ' + ($result) + ' ' + ($op);
    if (!$exclusive) {
      out += '=';
    }
    out += ' 0;';
  }
  out += '' + ($closingBraces) + 'if (!' + ($valid) + ') { ';
  var $errorKeyword = $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_formatLimit') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { comparison: ' + ($opExpr) + ', limit:  ';
    if ($isData) {
      out += '' + ($schemaValue);
    } else {
      out += '' + (it.util.toQuotedString($schema));
    }
    out += ' , exclusive: ' + ($exclusive) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should be ' + ($opStr) + ' "';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + (it.util.escapeQuotes($schema));
      }
      out += '"\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + (it.util.toQuotedString($schema));
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '}';
  return out;
}


/***/ }),

/***/ 1786:
/***/ ((module) => {

"use strict";

module.exports = function generate_patternRequired(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $key = 'key' + $lvl,
    $idx = 'idx' + $lvl,
    $matched = 'patternMatched' + $lvl,
    $dataProperties = 'dataProperties' + $lvl,
    $closingBraces = '',
    $ownProperties = it.opts.ownProperties;
  out += 'var ' + ($valid) + ' = true;';
  if ($ownProperties) {
    out += ' var ' + ($dataProperties) + ' = undefined;';
  }
  var arr1 = $schema;
  if (arr1) {
    var $pProperty, i1 = -1,
      l1 = arr1.length - 1;
    while (i1 < l1) {
      $pProperty = arr1[i1 += 1];
      out += ' var ' + ($matched) + ' = false;  ';
      if ($ownProperties) {
        out += ' ' + ($dataProperties) + ' = ' + ($dataProperties) + ' || Object.keys(' + ($data) + '); for (var ' + ($idx) + '=0; ' + ($idx) + '<' + ($dataProperties) + '.length; ' + ($idx) + '++) { var ' + ($key) + ' = ' + ($dataProperties) + '[' + ($idx) + ']; ';
      } else {
        out += ' for (var ' + ($key) + ' in ' + ($data) + ') { ';
      }
      out += ' ' + ($matched) + ' = ' + (it.usePattern($pProperty)) + '.test(' + ($key) + '); if (' + ($matched) + ') break; } ';
      var $missingPattern = it.util.escapeQuotes($pProperty);
      out += ' if (!' + ($matched) + ') { ' + ($valid) + ' = false;  var err =   '; /* istanbul ignore else */
      if (it.createErrors !== false) {
        out += ' { keyword: \'' + ('patternRequired') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingPattern: \'' + ($missingPattern) + '\' } ';
        if (it.opts.messages !== false) {
          out += ' , message: \'should have property matching pattern \\\'' + ($missingPattern) + '\\\'\' ';
        }
        if (it.opts.verbose) {
          out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
        }
        out += ' } ';
      } else {
        out += ' {} ';
      }
      out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; }   ';
      if ($breakOnError) {
        $closingBraces += '}';
        out += ' else { ';
      }
    }
  }
  out += '' + ($closingBraces);
  return out;
}


/***/ }),

/***/ 9538:
/***/ ((module) => {

"use strict";

module.exports = function generate_switch(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $ifPassed = 'ifPassed' + it.level,
    $currentBaseId = $it.baseId,
    $shouldContinue;
  out += 'var ' + ($ifPassed) + ';';
  var arr1 = $schema;
  if (arr1) {
    var $sch, $caseIndex = -1,
      l1 = arr1.length - 1;
    while ($caseIndex < l1) {
      $sch = arr1[$caseIndex += 1];
      if ($caseIndex && !$shouldContinue) {
        out += ' if (!' + ($ifPassed) + ') { ';
        $closingBraces += '}';
      }
      if ($sch.if && (it.opts.strictKeywords ? typeof $sch.if == 'object' && Object.keys($sch.if).length > 0 : it.util.schemaHasRules($sch.if, it.RULES.all))) {
        out += ' var ' + ($errs) + ' = errors;   ';
        var $wasComposite = it.compositeRule;
        it.compositeRule = $it.compositeRule = true;
        $it.createErrors = false;
        $it.schema = $sch.if;
        $it.schemaPath = $schemaPath + '[' + $caseIndex + '].if';
        $it.errSchemaPath = $errSchemaPath + '/' + $caseIndex + '/if';
        out += '  ' + (it.validate($it)) + ' ';
        $it.baseId = $currentBaseId;
        $it.createErrors = true;
        it.compositeRule = $it.compositeRule = $wasComposite;
        out += ' ' + ($ifPassed) + ' = ' + ($nextValid) + '; if (' + ($ifPassed) + ') {  ';
        if (typeof $sch.then == 'boolean') {
          if ($sch.then === false) {
            var $$outStack = $$outStack || [];
            $$outStack.push(out);
            out = ''; /* istanbul ignore else */
            if (it.createErrors !== false) {
              out += ' { keyword: \'' + ('switch') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { caseIndex: ' + ($caseIndex) + ' } ';
              if (it.opts.messages !== false) {
                out += ' , message: \'should pass "switch" keyword validation\' ';
              }
              if (it.opts.verbose) {
                out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
              }
              out += ' } ';
            } else {
              out += ' {} ';
            }
            var __err = out;
            out = $$outStack.pop();
            if (!it.compositeRule && $breakOnError) {
              /* istanbul ignore if */
              if (it.async) {
                out += ' throw new ValidationError([' + (__err) + ']); ';
              } else {
                out += ' validate.errors = [' + (__err) + ']; return false; ';
              }
            } else {
              out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
            }
          }
          out += ' var ' + ($nextValid) + ' = ' + ($sch.then) + '; ';
        } else {
          $it.schema = $sch.then;
          $it.schemaPath = $schemaPath + '[' + $caseIndex + '].then';
          $it.errSchemaPath = $errSchemaPath + '/' + $caseIndex + '/then';
          out += '  ' + (it.validate($it)) + ' ';
          $it.baseId = $currentBaseId;
        }
        out += '  } else {  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } } ';
      } else {
        out += ' ' + ($ifPassed) + ' = true;  ';
        if (typeof $sch.then == 'boolean') {
          if ($sch.then === false) {
            var $$outStack = $$outStack || [];
            $$outStack.push(out);
            out = ''; /* istanbul ignore else */
            if (it.createErrors !== false) {
              out += ' { keyword: \'' + ('switch') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { caseIndex: ' + ($caseIndex) + ' } ';
              if (it.opts.messages !== false) {
                out += ' , message: \'should pass "switch" keyword validation\' ';
              }
              if (it.opts.verbose) {
                out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
              }
              out += ' } ';
            } else {
              out += ' {} ';
            }
            var __err = out;
            out = $$outStack.pop();
            if (!it.compositeRule && $breakOnError) {
              /* istanbul ignore if */
              if (it.async) {
                out += ' throw new ValidationError([' + (__err) + ']); ';
              } else {
                out += ' validate.errors = [' + (__err) + ']; return false; ';
              }
            } else {
              out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
            }
          }
          out += ' var ' + ($nextValid) + ' = ' + ($sch.then) + '; ';
        } else {
          $it.schema = $sch.then;
          $it.schemaPath = $schemaPath + '[' + $caseIndex + '].then';
          $it.errSchemaPath = $errSchemaPath + '/' + $caseIndex + '/then';
          out += '  ' + (it.validate($it)) + ' ';
          $it.baseId = $currentBaseId;
        }
      }
      $shouldContinue = $sch.continue
    }
  }
  out += '' + ($closingBraces) + 'var ' + ($valid) + ' = ' + ($nextValid) + ';';
  return out;
}


/***/ }),

/***/ 6181:
/***/ ((module) => {

"use strict";


var sequences = {};

var DEFAULTS = {
  timestamp: function() { return Date.now(); },
  datetime: function() { return (new Date).toISOString(); },
  date: function() { return (new Date).toISOString().slice(0, 10); },
  time: function() { return (new Date).toISOString().slice(11); },
  random: function() { return Math.random(); },
  randomint: function (args) {
    var limit = args && args.max || 2;
    return function() { return Math.floor(Math.random() * limit); };
  },
  seq: function (args) {
    var name = args && args.name || '';
    sequences[name] = sequences[name] || 0;
    return function() { return sequences[name]++; };
  }
};

module.exports = function defFunc(ajv) {
  defFunc.definition = {
    compile: function (schema, parentSchema, it) {
      var funcs = {};

      for (var key in schema) {
        var d = schema[key];
        var func = getDefault(typeof d == 'string' ? d : d.func);
        funcs[key] = func.length ? func(d.args) : func;
      }

      return it.opts.useDefaults && !it.compositeRule
              ? assignDefaults
              : noop;

      function assignDefaults(data) {
        for (var prop in schema){
          if (data[prop] === undefined
            || (it.opts.useDefaults == 'empty'
            && (data[prop] === null || data[prop] === '')))
            data[prop] = funcs[prop]();
        }
        return true;
      }

      function noop() { return true; }
    },
    DEFAULTS: DEFAULTS,
    metaSchema: {
      type: 'object',
      additionalProperties: {
        type: ['string', 'object'],
        additionalProperties: false,
        required: ['func', 'args'],
        properties: {
          func: { type: 'string' },
          args: { type: 'object' }
        }
      }
    }
  };

  ajv.addKeyword('dynamicDefaults', defFunc.definition);
  return ajv;

  function getDefault(d) {
    var def = DEFAULTS[d];
    if (def) return def;
    throw new Error('invalid "dynamicDefaults" keyword property value: ' + d);
  }
};


/***/ }),

/***/ 3552:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = __webpack_require__(315)('Maximum');


/***/ }),

/***/ 2495:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = __webpack_require__(315)('Minimum');


/***/ }),

/***/ 2197:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = {
  'instanceof': __webpack_require__(6103),
  range: __webpack_require__(4614),
  regexp: __webpack_require__(9531),
  'typeof': __webpack_require__(2895),
  dynamicDefaults: __webpack_require__(6181),
  allRequired: __webpack_require__(7321),
  anyRequired: __webpack_require__(8268),
  oneRequired: __webpack_require__(6996),
  prohibited: __webpack_require__(5655),
  uniqueItemProperties: __webpack_require__(1067),
  deepProperties: __webpack_require__(9007),
  deepRequired: __webpack_require__(6452),
  formatMinimum: __webpack_require__(2495),
  formatMaximum: __webpack_require__(3552),
  patternRequired: __webpack_require__(6753),
  'switch': __webpack_require__(7461),
  select: __webpack_require__(605),
  transform: __webpack_require__(9673)
};


/***/ }),

/***/ 6103:
/***/ ((module) => {

"use strict";


var CONSTRUCTORS = {
  Object: Object,
  Array: Array,
  Function: Function,
  Number: Number,
  String: String,
  Date: Date,
  RegExp: RegExp
};

module.exports = function defFunc(ajv) {
  /* istanbul ignore else */
  if (typeof Buffer != 'undefined')
    CONSTRUCTORS.Buffer = Buffer;

  /* istanbul ignore else */
  if (typeof Promise != 'undefined')
    CONSTRUCTORS.Promise = Promise;

  defFunc.definition = {
    compile: function (schema) {
      if (typeof schema == 'string') {
        var Constructor = getConstructor(schema);
        return function (data) {
          return data instanceof Constructor;
        };
      }

      var constructors = schema.map(getConstructor);
      return function (data) {
        for (var i=0; i<constructors.length; i++)
          if (data instanceof constructors[i]) return true;
        return false;
      };
    },
    CONSTRUCTORS: CONSTRUCTORS,
    metaSchema: {
      anyOf: [
        { type: 'string' },
        {
          type: 'array',
          items: { type: 'string' }
        }
      ]
    }
  };

  ajv.addKeyword('instanceof', defFunc.definition);
  return ajv;

  function getConstructor(c) {
    var Constructor = CONSTRUCTORS[c];
    if (Constructor) return Constructor;
    throw new Error('invalid "instanceof" keyword value ' + c);
  }
};


/***/ }),

/***/ 6996:
/***/ ((module) => {

"use strict";


module.exports = function defFunc(ajv) {
  defFunc.definition = {
    type: 'object',
    macro: function (schema) {
      if (schema.length == 0) return true;
      if (schema.length == 1) return {required: schema};
      var schemas = schema.map(function (prop) {
        return {required: [prop]};
      });
      return {oneOf: schemas};
    },
    metaSchema: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  };

  ajv.addKeyword('oneRequired', defFunc.definition);
  return ajv;
};


/***/ }),

/***/ 6753:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = function defFunc(ajv) {
  defFunc.definition = {
    type: 'object',
    inline: __webpack_require__(1786),
    statements: true,
    errors: 'full',
    metaSchema: {
      type: 'array',
      items: {
        type: 'string',
        format: 'regex'
      },
      uniqueItems: true
    }
  };

  ajv.addKeyword('patternRequired', defFunc.definition);
  return ajv;
};


/***/ }),

/***/ 5655:
/***/ ((module) => {

"use strict";


module.exports = function defFunc(ajv) {
  defFunc.definition = {
    type: 'object',
    macro: function (schema) {
      if (schema.length == 0) return true;
      if (schema.length == 1) return {not: {required: schema}};
      var schemas = schema.map(function (prop) {
        return {required: [prop]};
      });
      return {not: {anyOf: schemas}};
    },
    metaSchema: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  };

  ajv.addKeyword('prohibited', defFunc.definition);
  return ajv;
};


/***/ }),

/***/ 4614:
/***/ ((module) => {

"use strict";


module.exports = function defFunc(ajv) {
  defFunc.definition = {
    type: 'number',
    macro: function (schema, parentSchema) {
      var min = schema[0]
        , max = schema[1]
        , exclusive = parentSchema.exclusiveRange;

      validateRangeSchema(min, max, exclusive);

      return exclusive === true
              ? {exclusiveMinimum: min, exclusiveMaximum: max}
              : {minimum: min, maximum: max};
    },
    metaSchema: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: { type: 'number' }
    }
  };

  ajv.addKeyword('range', defFunc.definition);
  ajv.addKeyword('exclusiveRange');
  return ajv;

  function validateRangeSchema(min, max, exclusive) {
    if (exclusive !== undefined && typeof exclusive != 'boolean')
      throw new Error('Invalid schema for exclusiveRange keyword, should be boolean');

    if (min > max || (exclusive && min == max))
      throw new Error('There are no numbers in range');
  }
};


/***/ }),

/***/ 9531:
/***/ ((module) => {

"use strict";


module.exports = function defFunc(ajv) {
  defFunc.definition = {
    type: 'string',
    inline: function (it, keyword, schema) {
      return getRegExp() + '.test(data' + (it.dataLevel || '') + ')';

      function getRegExp() {
        try {
          if (typeof schema == 'object')
            return new RegExp(schema.pattern, schema.flags);

          var rx = schema.match(/^\/(.*)\/([gimuy]*)$/);
          if (rx) return new RegExp(rx[1], rx[2]);
          throw new Error('cannot parse string into RegExp');
        } catch(e) {
          console.error('regular expression', schema, 'is invalid');
          throw e;
        }
      }
    },
    metaSchema: {
      type: ['string', 'object'],
      properties: {
        pattern: { type: 'string' },
        flags: { type: 'string' }
      },
      required: ['pattern'],
      additionalProperties: false
    }
  };

  ajv.addKeyword('regexp', defFunc.definition);
  return ajv;
};


/***/ }),

/***/ 605:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var util = __webpack_require__(221);

module.exports = function defFunc(ajv) {
  if (!ajv._opts.$data) {
    console.warn('keyword select requires $data option');
    return ajv;
  }
  var metaSchemaRef = util.metaSchemaRef(ajv);
  var compiledCaseSchemas = [];

  defFunc.definition = {
    validate: function v(schema, data, parentSchema) {
      if (parentSchema.selectCases === undefined)
        throw new Error('keyword "selectCases" is absent');
      var compiled = getCompiledSchemas(parentSchema, false);
      var validate = compiled.cases[schema];
      if (validate === undefined) validate = compiled.default;
      if (typeof validate == 'boolean') return validate;
      var valid = validate(data);
      if (!valid) v.errors = validate.errors;
      return valid;
    },
    $data: true,
    metaSchema: { type: ['string', 'number', 'boolean', 'null'] }
  };

  ajv.addKeyword('select', defFunc.definition);
  ajv.addKeyword('selectCases', {
    compile: function (schemas, parentSchema) {
      var compiled = getCompiledSchemas(parentSchema);
      for (var value in schemas)
        compiled.cases[value] = compileOrBoolean(schemas[value]);
      return function() { return true; };
    },
    valid: true,
    metaSchema: {
      type: 'object',
      additionalProperties: metaSchemaRef
    }
  });
  ajv.addKeyword('selectDefault', {
    compile: function (schema, parentSchema) {
      var compiled = getCompiledSchemas(parentSchema);
      compiled.default = compileOrBoolean(schema);
      return function() { return true; };
    },
    valid: true,
    metaSchema: metaSchemaRef
  });
  return ajv;


  function getCompiledSchemas(parentSchema, create) {
    var compiled;
    compiledCaseSchemas.some(function (c) {
      if (c.parentSchema === parentSchema) {
        compiled = c;
        return true;
      }
    });
    if (!compiled && create !== false) {
      compiled = {
        parentSchema: parentSchema,
        cases: {},
        default: true
      };
      compiledCaseSchemas.push(compiled);
    }
    return compiled;
  }

  function compileOrBoolean(schema) {
    return typeof schema == 'boolean'
            ? schema
            : ajv.compile(schema);
  }
};


/***/ }),

/***/ 7461:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var util = __webpack_require__(221);

module.exports = function defFunc(ajv) {
  if (ajv.RULES.keywords.switch && ajv.RULES.keywords.if) return;

  var metaSchemaRef = util.metaSchemaRef(ajv);

  defFunc.definition = {
    inline: __webpack_require__(9538),
    statements: true,
    errors: 'full',
    metaSchema: {
      type: 'array',
      items: {
        required: [ 'then' ],
        properties: {
          'if': metaSchemaRef,
          'then': {
            anyOf: [
              { type: 'boolean' },
              metaSchemaRef
            ]
          },
          'continue': { type: 'boolean' }
        },
        additionalProperties: false,
        dependencies: {
          'continue': [ 'if' ]
        }
      }
    }
  };

  ajv.addKeyword('switch', defFunc.definition);
  return ajv;
};


/***/ }),

/***/ 9673:
/***/ ((module) => {

"use strict";


module.exports = function defFunc (ajv) {
  var transform = {
    trimLeft: function (value) {
      return value.replace(/^[\s]+/, '');
    },
    trimRight: function (value) {
      return value.replace(/[\s]+$/, '');
    },
    trim: function (value) {
      return value.trim();
    },
    toLowerCase: function (value) {
      return value.toLowerCase();
    },
    toUpperCase: function (value) {
      return value.toUpperCase();
    },
    toEnumCase: function (value, cfg) {
      return cfg.hash[makeHashTableKey(value)] || value;
    }
  };

  defFunc.definition = {
    type: 'string',
    errors: false,
    modifying: true,
    valid: true,
    compile: function (schema, parentSchema) {
      var cfg;

      if (schema.indexOf('toEnumCase') !== -1) {
        // build hash table to enum values
        cfg = {hash: {}};

        // requires `enum` in schema
        if (!parentSchema.enum)
          throw new Error('Missing enum. To use `transform:["toEnumCase"]`, `enum:[...]` is required.');
        for (var i = parentSchema.enum.length; i--; i) {
          var v = parentSchema.enum[i];
          if (typeof v !== 'string') continue;
          var k = makeHashTableKey(v);
          // requires all `enum` values have unique keys
          if (cfg.hash[k])
            throw new Error('Invalid enum uniqueness. To use `transform:["toEnumCase"]`, all values must be unique when case insensitive.');
          cfg.hash[k] = v;
        }
      }

      return function (data, dataPath, object, key) {
        // skip if value only
        if (!object) return;

        // apply transform in order provided
        for (var j = 0, l = schema.length; j < l; j++)
          data = transform[schema[j]](data, cfg);

        object[key] = data;
      };
    },
    metaSchema: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'trimLeft', 'trimRight', 'trim',
          'toLowerCase', 'toUpperCase', 'toEnumCase'
        ]
      }
    }
  };

  ajv.addKeyword('transform', defFunc.definition);
  return ajv;

  function makeHashTableKey (value) {
    return value.toLowerCase();
  }
};


/***/ }),

/***/ 2895:
/***/ ((module) => {

"use strict";


var KNOWN_TYPES = ['undefined', 'string', 'number', 'object', 'function', 'boolean', 'symbol'];

module.exports = function defFunc(ajv) {
  defFunc.definition = {
    inline: function (it, keyword, schema) {
      var data = 'data' + (it.dataLevel || '');
      if (typeof schema == 'string') return 'typeof ' + data + ' == "' + schema + '"';
      schema = 'validate.schema' + it.schemaPath + '.' + keyword;
      return schema + '.indexOf(typeof ' + data + ') >= 0';
    },
    metaSchema: {
      anyOf: [
        {
          type: 'string',
          enum: KNOWN_TYPES
        },
        {
          type: 'array',
          items: {
            type: 'string',
            enum: KNOWN_TYPES
          }
        }
      ]
    }
  };

  ajv.addKeyword('typeof', defFunc.definition);
  return ajv;
};


/***/ }),

/***/ 1067:
/***/ ((module) => {

"use strict";


var SCALAR_TYPES = ['number', 'integer', 'string', 'boolean', 'null'];

module.exports = function defFunc(ajv) {
  defFunc.definition = {
    type: 'array',
    compile: function(keys, parentSchema, it) {
      var equal = it.util.equal;
      var scalar = getScalarKeys(keys, parentSchema);

      return function(data) {
        if (data.length > 1) {
          for (var k=0; k < keys.length; k++) {
            var i, key = keys[k];
            if (scalar[k]) {
              var hash = {};
              for (i = data.length; i--;) {
                if (!data[i] || typeof data[i] != 'object') continue;
                var prop = data[i][key];
                if (prop && typeof prop == 'object') continue;
                if (typeof prop == 'string') prop = '"' + prop;
                if (hash[prop]) return false;
                hash[prop] = true;
              }
            } else {
              for (i = data.length; i--;) {
                if (!data[i] || typeof data[i] != 'object') continue;
                for (var j = i; j--;) {
                  if (data[j] && typeof data[j] == 'object' && equal(data[i][key], data[j][key]))
                    return false;
                }
              }
            }
          }
        }
        return true;
      };
    },
    metaSchema: {
      type: 'array',
      items: {type: 'string'}
    }
  };

  ajv.addKeyword('uniqueItemProperties', defFunc.definition);
  return ajv;
};


function getScalarKeys(keys, schema) {
  return keys.map(function(key) {
    var properties = schema.items && schema.items.properties;
    var propType = properties && properties[key] && properties[key].type;
    return Array.isArray(propType)
            ? propType.indexOf('object') < 0 && propType.indexOf('array') < 0
            : SCALAR_TYPES.indexOf(propType) >= 0;
  });
}


/***/ }),

/***/ 4941:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var compileSchema = __webpack_require__(875)
  , resolve = __webpack_require__(3896)
  , Cache = __webpack_require__(3679)
  , SchemaObject = __webpack_require__(7605)
  , stableStringify = __webpack_require__(969)
  , formats = __webpack_require__(6627)
  , rules = __webpack_require__(8561)
  , $dataMetaSchema = __webpack_require__(1412)
  , util = __webpack_require__(6578);

module.exports = Ajv;

Ajv.prototype.validate = validate;
Ajv.prototype.compile = compile;
Ajv.prototype.addSchema = addSchema;
Ajv.prototype.addMetaSchema = addMetaSchema;
Ajv.prototype.validateSchema = validateSchema;
Ajv.prototype.getSchema = getSchema;
Ajv.prototype.removeSchema = removeSchema;
Ajv.prototype.addFormat = addFormat;
Ajv.prototype.errorsText = errorsText;

Ajv.prototype._addSchema = _addSchema;
Ajv.prototype._compile = _compile;

Ajv.prototype.compileAsync = __webpack_require__(890);
var customKeyword = __webpack_require__(3297);
Ajv.prototype.addKeyword = customKeyword.add;
Ajv.prototype.getKeyword = customKeyword.get;
Ajv.prototype.removeKeyword = customKeyword.remove;
Ajv.prototype.validateKeyword = customKeyword.validate;

var errorClasses = __webpack_require__(5726);
Ajv.ValidationError = errorClasses.Validation;
Ajv.MissingRefError = errorClasses.MissingRef;
Ajv.$dataMetaSchema = $dataMetaSchema;

var META_SCHEMA_ID = 'http://json-schema.org/draft-07/schema';

var META_IGNORE_OPTIONS = [ 'removeAdditional', 'useDefaults', 'coerceTypes', 'strictDefaults' ];
var META_SUPPORT_DATA = ['/properties'];

/**
 * Creates validator instance.
 * Usage: `Ajv(opts)`
 * @param {Object} opts optional options
 * @return {Object} ajv instance
 */
function Ajv(opts) {
  if (!(this instanceof Ajv)) return new Ajv(opts);
  opts = this._opts = util.copy(opts) || {};
  setLogger(this);
  this._schemas = {};
  this._refs = {};
  this._fragments = {};
  this._formats = formats(opts.format);

  this._cache = opts.cache || new Cache;
  this._loadingSchemas = {};
  this._compilations = [];
  this.RULES = rules();
  this._getId = chooseGetId(opts);

  opts.loopRequired = opts.loopRequired || Infinity;
  if (opts.errorDataPath == 'property') opts._errorDataPathProperty = true;
  if (opts.serialize === undefined) opts.serialize = stableStringify;
  this._metaOpts = getMetaSchemaOptions(this);

  if (opts.formats) addInitialFormats(this);
  if (opts.keywords) addInitialKeywords(this);
  addDefaultMetaSchema(this);
  if (typeof opts.meta == 'object') this.addMetaSchema(opts.meta);
  if (opts.nullable) this.addKeyword('nullable', {metaSchema: {type: 'boolean'}});
  addInitialSchemas(this);
}



/**
 * Validate data using schema
 * Schema will be compiled and cached (using serialized JSON as key. [fast-json-stable-stringify](https://github.com/epoberezkin/fast-json-stable-stringify) is used to serialize.
 * @this   Ajv
 * @param  {String|Object} schemaKeyRef key, ref or schema object
 * @param  {Any} data to be validated
 * @return {Boolean} validation result. Errors from the last validation will be available in `ajv.errors` (and also in compiled schema: `schema.errors`).
 */
function validate(schemaKeyRef, data) {
  var v;
  if (typeof schemaKeyRef == 'string') {
    v = this.getSchema(schemaKeyRef);
    if (!v) throw new Error('no schema with key or ref "' + schemaKeyRef + '"');
  } else {
    var schemaObj = this._addSchema(schemaKeyRef);
    v = schemaObj.validate || this._compile(schemaObj);
  }

  var valid = v(data);
  if (v.$async !== true) this.errors = v.errors;
  return valid;
}


/**
 * Create validating function for passed schema.
 * @this   Ajv
 * @param  {Object} schema schema object
 * @param  {Boolean} _meta true if schema is a meta-schema. Used internally to compile meta schemas of custom keywords.
 * @return {Function} validating function
 */
function compile(schema, _meta) {
  var schemaObj = this._addSchema(schema, undefined, _meta);
  return schemaObj.validate || this._compile(schemaObj);
}


/**
 * Adds schema to the instance.
 * @this   Ajv
 * @param {Object|Array} schema schema or array of schemas. If array is passed, `key` and other parameters will be ignored.
 * @param {String} key Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
 * @param {Boolean} _skipValidation true to skip schema validation. Used internally, option validateSchema should be used instead.
 * @param {Boolean} _meta true if schema is a meta-schema. Used internally, addMetaSchema should be used instead.
 * @return {Ajv} this for method chaining
 */
function addSchema(schema, key, _skipValidation, _meta) {
  if (Array.isArray(schema)){
    for (var i=0; i<schema.length; i++) this.addSchema(schema[i], undefined, _skipValidation, _meta);
    return this;
  }
  var id = this._getId(schema);
  if (id !== undefined && typeof id != 'string')
    throw new Error('schema id must be string');
  key = resolve.normalizeId(key || id);
  checkUnique(this, key);
  this._schemas[key] = this._addSchema(schema, _skipValidation, _meta, true);
  return this;
}


/**
 * Add schema that will be used to validate other schemas
 * options in META_IGNORE_OPTIONS are alway set to false
 * @this   Ajv
 * @param {Object} schema schema object
 * @param {String} key optional schema key
 * @param {Boolean} skipValidation true to skip schema validation, can be used to override validateSchema option for meta-schema
 * @return {Ajv} this for method chaining
 */
function addMetaSchema(schema, key, skipValidation) {
  this.addSchema(schema, key, skipValidation, true);
  return this;
}


/**
 * Validate schema
 * @this   Ajv
 * @param {Object} schema schema to validate
 * @param {Boolean} throwOrLogError pass true to throw (or log) an error if invalid
 * @return {Boolean} true if schema is valid
 */
function validateSchema(schema, throwOrLogError) {
  var $schema = schema.$schema;
  if ($schema !== undefined && typeof $schema != 'string')
    throw new Error('$schema must be a string');
  $schema = $schema || this._opts.defaultMeta || defaultMeta(this);
  if (!$schema) {
    this.logger.warn('meta-schema not available');
    this.errors = null;
    return true;
  }
  var valid = this.validate($schema, schema);
  if (!valid && throwOrLogError) {
    var message = 'schema is invalid: ' + this.errorsText();
    if (this._opts.validateSchema == 'log') this.logger.error(message);
    else throw new Error(message);
  }
  return valid;
}


function defaultMeta(self) {
  var meta = self._opts.meta;
  self._opts.defaultMeta = typeof meta == 'object'
                            ? self._getId(meta) || meta
                            : self.getSchema(META_SCHEMA_ID)
                              ? META_SCHEMA_ID
                              : undefined;
  return self._opts.defaultMeta;
}


/**
 * Get compiled schema from the instance by `key` or `ref`.
 * @this   Ajv
 * @param  {String} keyRef `key` that was passed to `addSchema` or full schema reference (`schema.id` or resolved id).
 * @return {Function} schema validating function (with property `schema`).
 */
function getSchema(keyRef) {
  var schemaObj = _getSchemaObj(this, keyRef);
  switch (typeof schemaObj) {
    case 'object': return schemaObj.validate || this._compile(schemaObj);
    case 'string': return this.getSchema(schemaObj);
    case 'undefined': return _getSchemaFragment(this, keyRef);
  }
}


function _getSchemaFragment(self, ref) {
  var res = resolve.schema.call(self, { schema: {} }, ref);
  if (res) {
    var schema = res.schema
      , root = res.root
      , baseId = res.baseId;
    var v = compileSchema.call(self, schema, root, undefined, baseId);
    self._fragments[ref] = new SchemaObject({
      ref: ref,
      fragment: true,
      schema: schema,
      root: root,
      baseId: baseId,
      validate: v
    });
    return v;
  }
}


function _getSchemaObj(self, keyRef) {
  keyRef = resolve.normalizeId(keyRef);
  return self._schemas[keyRef] || self._refs[keyRef] || self._fragments[keyRef];
}


/**
 * Remove cached schema(s).
 * If no parameter is passed all schemas but meta-schemas are removed.
 * If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
 * Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
 * @this   Ajv
 * @param  {String|Object|RegExp} schemaKeyRef key, ref, pattern to match key/ref or schema object
 * @return {Ajv} this for method chaining
 */
function removeSchema(schemaKeyRef) {
  if (schemaKeyRef instanceof RegExp) {
    _removeAllSchemas(this, this._schemas, schemaKeyRef);
    _removeAllSchemas(this, this._refs, schemaKeyRef);
    return this;
  }
  switch (typeof schemaKeyRef) {
    case 'undefined':
      _removeAllSchemas(this, this._schemas);
      _removeAllSchemas(this, this._refs);
      this._cache.clear();
      return this;
    case 'string':
      var schemaObj = _getSchemaObj(this, schemaKeyRef);
      if (schemaObj) this._cache.del(schemaObj.cacheKey);
      delete this._schemas[schemaKeyRef];
      delete this._refs[schemaKeyRef];
      return this;
    case 'object':
      var serialize = this._opts.serialize;
      var cacheKey = serialize ? serialize(schemaKeyRef) : schemaKeyRef;
      this._cache.del(cacheKey);
      var id = this._getId(schemaKeyRef);
      if (id) {
        id = resolve.normalizeId(id);
        delete this._schemas[id];
        delete this._refs[id];
      }
  }
  return this;
}


function _removeAllSchemas(self, schemas, regex) {
  for (var keyRef in schemas) {
    var schemaObj = schemas[keyRef];
    if (!schemaObj.meta && (!regex || regex.test(keyRef))) {
      self._cache.del(schemaObj.cacheKey);
      delete schemas[keyRef];
    }
  }
}


/* @this   Ajv */
function _addSchema(schema, skipValidation, meta, shouldAddSchema) {
  if (typeof schema != 'object' && typeof schema != 'boolean')
    throw new Error('schema should be object or boolean');
  var serialize = this._opts.serialize;
  var cacheKey = serialize ? serialize(schema) : schema;
  var cached = this._cache.get(cacheKey);
  if (cached) return cached;

  shouldAddSchema = shouldAddSchema || this._opts.addUsedSchema !== false;

  var id = resolve.normalizeId(this._getId(schema));
  if (id && shouldAddSchema) checkUnique(this, id);

  var willValidate = this._opts.validateSchema !== false && !skipValidation;
  var recursiveMeta;
  if (willValidate && !(recursiveMeta = id && id == resolve.normalizeId(schema.$schema)))
    this.validateSchema(schema, true);

  var localRefs = resolve.ids.call(this, schema);

  var schemaObj = new SchemaObject({
    id: id,
    schema: schema,
    localRefs: localRefs,
    cacheKey: cacheKey,
    meta: meta
  });

  if (id[0] != '#' && shouldAddSchema) this._refs[id] = schemaObj;
  this._cache.put(cacheKey, schemaObj);

  if (willValidate && recursiveMeta) this.validateSchema(schema, true);

  return schemaObj;
}


/* @this   Ajv */
function _compile(schemaObj, root) {
  if (schemaObj.compiling) {
    schemaObj.validate = callValidate;
    callValidate.schema = schemaObj.schema;
    callValidate.errors = null;
    callValidate.root = root ? root : callValidate;
    if (schemaObj.schema.$async === true)
      callValidate.$async = true;
    return callValidate;
  }
  schemaObj.compiling = true;

  var currentOpts;
  if (schemaObj.meta) {
    currentOpts = this._opts;
    this._opts = this._metaOpts;
  }

  var v;
  try { v = compileSchema.call(this, schemaObj.schema, root, schemaObj.localRefs); }
  catch(e) {
    delete schemaObj.validate;
    throw e;
  }
  finally {
    schemaObj.compiling = false;
    if (schemaObj.meta) this._opts = currentOpts;
  }

  schemaObj.validate = v;
  schemaObj.refs = v.refs;
  schemaObj.refVal = v.refVal;
  schemaObj.root = v.root;
  return v;


  /* @this   {*} - custom context, see passContext option */
  function callValidate() {
    /* jshint validthis: true */
    var _validate = schemaObj.validate;
    var result = _validate.apply(this, arguments);
    callValidate.errors = _validate.errors;
    return result;
  }
}


function chooseGetId(opts) {
  switch (opts.schemaId) {
    case 'auto': return _get$IdOrId;
    case 'id': return _getId;
    default: return _get$Id;
  }
}

/* @this   Ajv */
function _getId(schema) {
  if (schema.$id) this.logger.warn('schema $id ignored', schema.$id);
  return schema.id;
}

/* @this   Ajv */
function _get$Id(schema) {
  if (schema.id) this.logger.warn('schema id ignored', schema.id);
  return schema.$id;
}


function _get$IdOrId(schema) {
  if (schema.$id && schema.id && schema.$id != schema.id)
    throw new Error('schema $id is different from id');
  return schema.$id || schema.id;
}


/**
 * Convert array of error message objects to string
 * @this   Ajv
 * @param  {Array<Object>} errors optional array of validation errors, if not passed errors from the instance are used.
 * @param  {Object} options optional options with properties `separator` and `dataVar`.
 * @return {String} human readable string with all errors descriptions
 */
function errorsText(errors, options) {
  errors = errors || this.errors;
  if (!errors) return 'No errors';
  options = options || {};
  var separator = options.separator === undefined ? ', ' : options.separator;
  var dataVar = options.dataVar === undefined ? 'data' : options.dataVar;

  var text = '';
  for (var i=0; i<errors.length; i++) {
    var e = errors[i];
    if (e) text += dataVar + e.dataPath + ' ' + e.message + separator;
  }
  return text.slice(0, -separator.length);
}


/**
 * Add custom format
 * @this   Ajv
 * @param {String} name format name
 * @param {String|RegExp|Function} format string is converted to RegExp; function should return boolean (true when valid)
 * @return {Ajv} this for method chaining
 */
function addFormat(name, format) {
  if (typeof format == 'string') format = new RegExp(format);
  this._formats[name] = format;
  return this;
}


function addDefaultMetaSchema(self) {
  var $dataSchema;
  if (self._opts.$data) {
    $dataSchema = __webpack_require__(6835);
    self.addMetaSchema($dataSchema, $dataSchema.$id, true);
  }
  if (self._opts.meta === false) return;
  var metaSchema = __webpack_require__(38);
  if (self._opts.$data) metaSchema = $dataMetaSchema(metaSchema, META_SUPPORT_DATA);
  self.addMetaSchema(metaSchema, META_SCHEMA_ID, true);
  self._refs['http://json-schema.org/schema'] = META_SCHEMA_ID;
}


function addInitialSchemas(self) {
  var optsSchemas = self._opts.schemas;
  if (!optsSchemas) return;
  if (Array.isArray(optsSchemas)) self.addSchema(optsSchemas);
  else for (var key in optsSchemas) self.addSchema(optsSchemas[key], key);
}


function addInitialFormats(self) {
  for (var name in self._opts.formats) {
    var format = self._opts.formats[name];
    self.addFormat(name, format);
  }
}


function addInitialKeywords(self) {
  for (var name in self._opts.keywords) {
    var keyword = self._opts.keywords[name];
    self.addKeyword(name, keyword);
  }
}


function checkUnique(self, id) {
  if (self._schemas[id] || self._refs[id])
    throw new Error('schema with key or id "' + id + '" already exists');
}


function getMetaSchemaOptions(self) {
  var metaOpts = util.copy(self._opts);
  for (var i=0; i<META_IGNORE_OPTIONS.length; i++)
    delete metaOpts[META_IGNORE_OPTIONS[i]];
  return metaOpts;
}


function setLogger(self) {
  var logger = self._opts.logger;
  if (logger === false) {
    self.logger = {log: noop, warn: noop, error: noop};
  } else {
    if (logger === undefined) logger = console;
    if (!(typeof logger == 'object' && logger.log && logger.warn && logger.error))
      throw new Error('logger must implement log, warn and error methods');
    self.logger = logger;
  }
}


function noop() {}


/***/ }),

/***/ 3679:
/***/ ((module) => {

"use strict";



var Cache = module.exports = function Cache() {
  this._cache = {};
};


Cache.prototype.put = function Cache_put(key, value) {
  this._cache[key] = value;
};


Cache.prototype.get = function Cache_get(key) {
  return this._cache[key];
};


Cache.prototype.del = function Cache_del(key) {
  delete this._cache[key];
};


Cache.prototype.clear = function Cache_clear() {
  this._cache = {};
};


/***/ }),

/***/ 890:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var MissingRefError = __webpack_require__(5726).MissingRef;

module.exports = compileAsync;


/**
 * Creates validating function for passed schema with asynchronous loading of missing schemas.
 * `loadSchema` option should be a function that accepts schema uri and returns promise that resolves with the schema.
 * @this  Ajv
 * @param {Object}   schema schema object
 * @param {Boolean}  meta optional true to compile meta-schema; this parameter can be skipped
 * @param {Function} callback an optional node-style callback, it is called with 2 parameters: error (or null) and validating function.
 * @return {Promise} promise that resolves with a validating function.
 */
function compileAsync(schema, meta, callback) {
  /* eslint no-shadow: 0 */
  /* global Promise */
  /* jshint validthis: true */
  var self = this;
  if (typeof this._opts.loadSchema != 'function')
    throw new Error('options.loadSchema should be a function');

  if (typeof meta == 'function') {
    callback = meta;
    meta = undefined;
  }

  var p = loadMetaSchemaOf(schema).then(function () {
    var schemaObj = self._addSchema(schema, undefined, meta);
    return schemaObj.validate || _compileAsync(schemaObj);
  });

  if (callback) {
    p.then(
      function(v) { callback(null, v); },
      callback
    );
  }

  return p;


  function loadMetaSchemaOf(sch) {
    var $schema = sch.$schema;
    return $schema && !self.getSchema($schema)
            ? compileAsync.call(self, { $ref: $schema }, true)
            : Promise.resolve();
  }


  function _compileAsync(schemaObj) {
    try { return self._compile(schemaObj); }
    catch(e) {
      if (e instanceof MissingRefError) return loadMissingSchema(e);
      throw e;
    }


    function loadMissingSchema(e) {
      var ref = e.missingSchema;
      if (added(ref)) throw new Error('Schema ' + ref + ' is loaded but ' + e.missingRef + ' cannot be resolved');

      var schemaPromise = self._loadingSchemas[ref];
      if (!schemaPromise) {
        schemaPromise = self._loadingSchemas[ref] = self._opts.loadSchema(ref);
        schemaPromise.then(removePromise, removePromise);
      }

      return schemaPromise.then(function (sch) {
        if (!added(ref)) {
          return loadMetaSchemaOf(sch).then(function () {
            if (!added(ref)) self.addSchema(sch, ref, undefined, meta);
          });
        }
      }).then(function() {
        return _compileAsync(schemaObj);
      });

      function removePromise() {
        delete self._loadingSchemas[ref];
      }

      function added(ref) {
        return self._refs[ref] || self._schemas[ref];
      }
    }
  }
}


/***/ }),

/***/ 5726:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var resolve = __webpack_require__(3896);

module.exports = {
  Validation: errorSubclass(ValidationError),
  MissingRef: errorSubclass(MissingRefError)
};


function ValidationError(errors) {
  this.message = 'validation failed';
  this.errors = errors;
  this.ajv = this.validation = true;
}


MissingRefError.message = function (baseId, ref) {
  return 'can\'t resolve reference ' + ref + ' from id ' + baseId;
};


function MissingRefError(baseId, ref, message) {
  this.message = message || MissingRefError.message(baseId, ref);
  this.missingRef = resolve.url(baseId, ref);
  this.missingSchema = resolve.normalizeId(resolve.fullPath(this.missingRef));
}


function errorSubclass(Subclass) {
  Subclass.prototype = Object.create(Error.prototype);
  Subclass.prototype.constructor = Subclass;
  return Subclass;
}


/***/ }),

/***/ 6627:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var util = __webpack_require__(6578);

var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
var DAYS = [0,31,28,31,30,31,30,31,31,30,31,30,31];
var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
var HOSTNAME = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i;
var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
var URIREF = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
// uri-template: https://tools.ietf.org/html/rfc6570
var URITEMPLATE = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
// For the source: https://gist.github.com/dperini/729294
// For test cases: https://mathiasbynens.be/demo/url-regex
// @todo Delete current URL in favour of the commented out URL rule when this issue is fixed https://github.com/eslint/eslint/issues/7983.
// var URL = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u{00a1}-\u{ffff}0-9]+-)*[a-z\u{00a1}-\u{ffff}0-9]+)(?:\.(?:[a-z\u{00a1}-\u{ffff}0-9]+-)*[a-z\u{00a1}-\u{ffff}0-9]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
var URL = /^(?:(?:http[s\u017F]?|ftp):\/\/)(?:(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+(?::(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?@)?(?:(?!10(?:\.[0-9]{1,3}){3})(?!127(?:\.[0-9]{1,3}){3})(?!169\.254(?:\.[0-9]{1,3}){2})(?!192\.168(?:\.[0-9]{1,3}){2})(?!172\.(?:1[6-9]|2[0-9]|3[01])(?:\.[0-9]{1,3}){2})(?:[1-9][0-9]?|1[0-9][0-9]|2[01][0-9]|22[0-3])(?:\.(?:1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])){2}(?:\.(?:[1-9][0-9]?|1[0-9][0-9]|2[0-4][0-9]|25[0-4]))|(?:(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)(?:\.(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)*(?:\.(?:(?:[a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]){2,})))(?::[0-9]{2,5})?(?:\/(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?$/i;
var UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
var JSON_POINTER = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
var JSON_POINTER_URI_FRAGMENT = /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i;
var RELATIVE_JSON_POINTER = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;


module.exports = formats;

function formats(mode) {
  mode = mode == 'full' ? 'full' : 'fast';
  return util.copy(formats[mode]);
}


formats.fast = {
  // date: http://tools.ietf.org/html/rfc3339#section-5.6
  date: /^\d\d\d\d-[0-1]\d-[0-3]\d$/,
  // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
  time: /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,
  'date-time': /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
  // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
  uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
  'uri-reference': /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
  'uri-template': URITEMPLATE,
  url: URL,
  // email (sources from jsen validator):
  // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
  // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'willful violation')
  email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
  hostname: HOSTNAME,
  // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  // optimized http://stackoverflow.com/questions/53497/regular-expression-that-matches-valid-ipv6-addresses
  ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
  regex: regex,
  // uuid: http://tools.ietf.org/html/rfc4122
  uuid: UUID,
  // JSON-pointer: https://tools.ietf.org/html/rfc6901
  // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
  'json-pointer': JSON_POINTER,
  'json-pointer-uri-fragment': JSON_POINTER_URI_FRAGMENT,
  // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
  'relative-json-pointer': RELATIVE_JSON_POINTER
};


formats.full = {
  date: date,
  time: time,
  'date-time': date_time,
  uri: uri,
  'uri-reference': URIREF,
  'uri-template': URITEMPLATE,
  url: URL,
  email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
  hostname: HOSTNAME,
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
  regex: regex,
  uuid: UUID,
  'json-pointer': JSON_POINTER,
  'json-pointer-uri-fragment': JSON_POINTER_URI_FRAGMENT,
  'relative-json-pointer': RELATIVE_JSON_POINTER
};


function isLeapYear(year) {
  // https://tools.ietf.org/html/rfc3339#appendix-C
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}


function date(str) {
  // full-date from http://tools.ietf.org/html/rfc3339#section-5.6
  var matches = str.match(DATE);
  if (!matches) return false;

  var year = +matches[1];
  var month = +matches[2];
  var day = +matches[3];

  return month >= 1 && month <= 12 && day >= 1 &&
          day <= (month == 2 && isLeapYear(year) ? 29 : DAYS[month]);
}


function time(str, full) {
  var matches = str.match(TIME);
  if (!matches) return false;

  var hour = matches[1];
  var minute = matches[2];
  var second = matches[3];
  var timeZone = matches[5];
  return ((hour <= 23 && minute <= 59 && second <= 59) ||
          (hour == 23 && minute == 59 && second == 60)) &&
         (!full || timeZone);
}


var DATE_TIME_SEPARATOR = /t|\s/i;
function date_time(str) {
  // http://tools.ietf.org/html/rfc3339#section-5.6
  var dateTime = str.split(DATE_TIME_SEPARATOR);
  return dateTime.length == 2 && date(dateTime[0]) && time(dateTime[1], true);
}


var NOT_URI_FRAGMENT = /\/|:/;
function uri(str) {
  // http://jmrware.com/articles/2009/uri_regexp/URI_regex.html + optional protocol + required "."
  return NOT_URI_FRAGMENT.test(str) && URI.test(str);
}


var Z_ANCHOR = /[^\\]\\Z/;
function regex(str) {
  if (Z_ANCHOR.test(str)) return false;
  try {
    new RegExp(str);
    return true;
  } catch(e) {
    return false;
  }
}


/***/ }),

/***/ 875:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var resolve = __webpack_require__(3896)
  , util = __webpack_require__(6578)
  , errorClasses = __webpack_require__(5726)
  , stableStringify = __webpack_require__(969);

var validateGenerator = __webpack_require__(9585);

/**
 * Functions below are used inside compiled validations function
 */

var ucs2length = util.ucs2length;
var equal = __webpack_require__(8206);

// this error is thrown by async schemas to return validation errors via exception
var ValidationError = errorClasses.Validation;

module.exports = compile;


/**
 * Compiles schema to validation function
 * @this   Ajv
 * @param  {Object} schema schema object
 * @param  {Object} root object with information about the root schema for this schema
 * @param  {Object} localRefs the hash of local references inside the schema (created by resolve.id), used for inline resolution
 * @param  {String} baseId base ID for IDs in the schema
 * @return {Function} validation function
 */
function compile(schema, root, localRefs, baseId) {
  /* jshint validthis: true, evil: true */
  /* eslint no-shadow: 0 */
  var self = this
    , opts = this._opts
    , refVal = [ undefined ]
    , refs = {}
    , patterns = []
    , patternsHash = {}
    , defaults = []
    , defaultsHash = {}
    , customRules = [];

  root = root || { schema: schema, refVal: refVal, refs: refs };

  var c = checkCompiling.call(this, schema, root, baseId);
  var compilation = this._compilations[c.index];
  if (c.compiling) return (compilation.callValidate = callValidate);

  var formats = this._formats;
  var RULES = this.RULES;

  try {
    var v = localCompile(schema, root, localRefs, baseId);
    compilation.validate = v;
    var cv = compilation.callValidate;
    if (cv) {
      cv.schema = v.schema;
      cv.errors = null;
      cv.refs = v.refs;
      cv.refVal = v.refVal;
      cv.root = v.root;
      cv.$async = v.$async;
      if (opts.sourceCode) cv.source = v.source;
    }
    return v;
  } finally {
    endCompiling.call(this, schema, root, baseId);
  }

  /* @this   {*} - custom context, see passContext option */
  function callValidate() {
    /* jshint validthis: true */
    var validate = compilation.validate;
    var result = validate.apply(this, arguments);
    callValidate.errors = validate.errors;
    return result;
  }

  function localCompile(_schema, _root, localRefs, baseId) {
    var isRoot = !_root || (_root && _root.schema == _schema);
    if (_root.schema != root.schema)
      return compile.call(self, _schema, _root, localRefs, baseId);

    var $async = _schema.$async === true;

    var sourceCode = validateGenerator({
      isTop: true,
      schema: _schema,
      isRoot: isRoot,
      baseId: baseId,
      root: _root,
      schemaPath: '',
      errSchemaPath: '#',
      errorPath: '""',
      MissingRefError: errorClasses.MissingRef,
      RULES: RULES,
      validate: validateGenerator,
      util: util,
      resolve: resolve,
      resolveRef: resolveRef,
      usePattern: usePattern,
      useDefault: useDefault,
      useCustomRule: useCustomRule,
      opts: opts,
      formats: formats,
      logger: self.logger,
      self: self
    });

    sourceCode = vars(refVal, refValCode) + vars(patterns, patternCode)
                   + vars(defaults, defaultCode) + vars(customRules, customRuleCode)
                   + sourceCode;

    if (opts.processCode) sourceCode = opts.processCode(sourceCode, _schema);
    // console.log('\n\n\n *** \n', JSON.stringify(sourceCode));
    var validate;
    try {
      var makeValidate = new Function(
        'self',
        'RULES',
        'formats',
        'root',
        'refVal',
        'defaults',
        'customRules',
        'equal',
        'ucs2length',
        'ValidationError',
        sourceCode
      );

      validate = makeValidate(
        self,
        RULES,
        formats,
        root,
        refVal,
        defaults,
        customRules,
        equal,
        ucs2length,
        ValidationError
      );

      refVal[0] = validate;
    } catch(e) {
      self.logger.error('Error compiling schema, function code:', sourceCode);
      throw e;
    }

    validate.schema = _schema;
    validate.errors = null;
    validate.refs = refs;
    validate.refVal = refVal;
    validate.root = isRoot ? validate : _root;
    if ($async) validate.$async = true;
    if (opts.sourceCode === true) {
      validate.source = {
        code: sourceCode,
        patterns: patterns,
        defaults: defaults
      };
    }

    return validate;
  }

  function resolveRef(baseId, ref, isRoot) {
    ref = resolve.url(baseId, ref);
    var refIndex = refs[ref];
    var _refVal, refCode;
    if (refIndex !== undefined) {
      _refVal = refVal[refIndex];
      refCode = 'refVal[' + refIndex + ']';
      return resolvedRef(_refVal, refCode);
    }
    if (!isRoot && root.refs) {
      var rootRefId = root.refs[ref];
      if (rootRefId !== undefined) {
        _refVal = root.refVal[rootRefId];
        refCode = addLocalRef(ref, _refVal);
        return resolvedRef(_refVal, refCode);
      }
    }

    refCode = addLocalRef(ref);
    var v = resolve.call(self, localCompile, root, ref);
    if (v === undefined) {
      var localSchema = localRefs && localRefs[ref];
      if (localSchema) {
        v = resolve.inlineRef(localSchema, opts.inlineRefs)
            ? localSchema
            : compile.call(self, localSchema, root, localRefs, baseId);
      }
    }

    if (v === undefined) {
      removeLocalRef(ref);
    } else {
      replaceLocalRef(ref, v);
      return resolvedRef(v, refCode);
    }
  }

  function addLocalRef(ref, v) {
    var refId = refVal.length;
    refVal[refId] = v;
    refs[ref] = refId;
    return 'refVal' + refId;
  }

  function removeLocalRef(ref) {
    delete refs[ref];
  }

  function replaceLocalRef(ref, v) {
    var refId = refs[ref];
    refVal[refId] = v;
  }

  function resolvedRef(refVal, code) {
    return typeof refVal == 'object' || typeof refVal == 'boolean'
            ? { code: code, schema: refVal, inline: true }
            : { code: code, $async: refVal && !!refVal.$async };
  }

  function usePattern(regexStr) {
    var index = patternsHash[regexStr];
    if (index === undefined) {
      index = patternsHash[regexStr] = patterns.length;
      patterns[index] = regexStr;
    }
    return 'pattern' + index;
  }

  function useDefault(value) {
    switch (typeof value) {
      case 'boolean':
      case 'number':
        return '' + value;
      case 'string':
        return util.toQuotedString(value);
      case 'object':
        if (value === null) return 'null';
        var valueStr = stableStringify(value);
        var index = defaultsHash[valueStr];
        if (index === undefined) {
          index = defaultsHash[valueStr] = defaults.length;
          defaults[index] = value;
        }
        return 'default' + index;
    }
  }

  function useCustomRule(rule, schema, parentSchema, it) {
    if (self._opts.validateSchema !== false) {
      var deps = rule.definition.dependencies;
      if (deps && !deps.every(function(keyword) {
        return Object.prototype.hasOwnProperty.call(parentSchema, keyword);
      }))
        throw new Error('parent schema must have all required keywords: ' + deps.join(','));

      var validateSchema = rule.definition.validateSchema;
      if (validateSchema) {
        var valid = validateSchema(schema);
        if (!valid) {
          var message = 'keyword schema is invalid: ' + self.errorsText(validateSchema.errors);
          if (self._opts.validateSchema == 'log') self.logger.error(message);
          else throw new Error(message);
        }
      }
    }

    var compile = rule.definition.compile
      , inline = rule.definition.inline
      , macro = rule.definition.macro;

    var validate;
    if (compile) {
      validate = compile.call(self, schema, parentSchema, it);
    } else if (macro) {
      validate = macro.call(self, schema, parentSchema, it);
      if (opts.validateSchema !== false) self.validateSchema(validate, true);
    } else if (inline) {
      validate = inline.call(self, it, rule.keyword, schema, parentSchema);
    } else {
      validate = rule.definition.validate;
      if (!validate) return;
    }

    if (validate === undefined)
      throw new Error('custom keyword "' + rule.keyword + '"failed to compile');

    var index = customRules.length;
    customRules[index] = validate;

    return {
      code: 'customRule' + index,
      validate: validate
    };
  }
}


/**
 * Checks if the schema is currently compiled
 * @this   Ajv
 * @param  {Object} schema schema to compile
 * @param  {Object} root root object
 * @param  {String} baseId base schema ID
 * @return {Object} object with properties "index" (compilation index) and "compiling" (boolean)
 */
function checkCompiling(schema, root, baseId) {
  /* jshint validthis: true */
  var index = compIndex.call(this, schema, root, baseId);
  if (index >= 0) return { index: index, compiling: true };
  index = this._compilations.length;
  this._compilations[index] = {
    schema: schema,
    root: root,
    baseId: baseId
  };
  return { index: index, compiling: false };
}


/**
 * Removes the schema from the currently compiled list
 * @this   Ajv
 * @param  {Object} schema schema to compile
 * @param  {Object} root root object
 * @param  {String} baseId base schema ID
 */
function endCompiling(schema, root, baseId) {
  /* jshint validthis: true */
  var i = compIndex.call(this, schema, root, baseId);
  if (i >= 0) this._compilations.splice(i, 1);
}


/**
 * Index of schema compilation in the currently compiled list
 * @this   Ajv
 * @param  {Object} schema schema to compile
 * @param  {Object} root root object
 * @param  {String} baseId base schema ID
 * @return {Integer} compilation index
 */
function compIndex(schema, root, baseId) {
  /* jshint validthis: true */
  for (var i=0; i<this._compilations.length; i++) {
    var c = this._compilations[i];
    if (c.schema == schema && c.root == root && c.baseId == baseId) return i;
  }
  return -1;
}


function patternCode(i, patterns) {
  return 'var pattern' + i + ' = new RegExp(' + util.toQuotedString(patterns[i]) + ');';
}


function defaultCode(i) {
  return 'var default' + i + ' = defaults[' + i + '];';
}


function refValCode(i, refVal) {
  return refVal[i] === undefined ? '' : 'var refVal' + i + ' = refVal[' + i + '];';
}


function customRuleCode(i) {
  return 'var customRule' + i + ' = customRules[' + i + '];';
}


function vars(arr, statement) {
  if (!arr.length) return '';
  var code = '';
  for (var i=0; i<arr.length; i++)
    code += statement(i, arr);
  return code;
}


/***/ }),

/***/ 3896:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var URI = __webpack_require__(20)
  , equal = __webpack_require__(8206)
  , util = __webpack_require__(6578)
  , SchemaObject = __webpack_require__(7605)
  , traverse = __webpack_require__(2533);

module.exports = resolve;

resolve.normalizeId = normalizeId;
resolve.fullPath = getFullPath;
resolve.url = resolveUrl;
resolve.ids = resolveIds;
resolve.inlineRef = inlineRef;
resolve.schema = resolveSchema;

/**
 * [resolve and compile the references ($ref)]
 * @this   Ajv
 * @param  {Function} compile reference to schema compilation funciton (localCompile)
 * @param  {Object} root object with information about the root schema for the current schema
 * @param  {String} ref reference to resolve
 * @return {Object|Function} schema object (if the schema can be inlined) or validation function
 */
function resolve(compile, root, ref) {
  /* jshint validthis: true */
  var refVal = this._refs[ref];
  if (typeof refVal == 'string') {
    if (this._refs[refVal]) refVal = this._refs[refVal];
    else return resolve.call(this, compile, root, refVal);
  }

  refVal = refVal || this._schemas[ref];
  if (refVal instanceof SchemaObject) {
    return inlineRef(refVal.schema, this._opts.inlineRefs)
            ? refVal.schema
            : refVal.validate || this._compile(refVal);
  }

  var res = resolveSchema.call(this, root, ref);
  var schema, v, baseId;
  if (res) {
    schema = res.schema;
    root = res.root;
    baseId = res.baseId;
  }

  if (schema instanceof SchemaObject) {
    v = schema.validate || compile.call(this, schema.schema, root, undefined, baseId);
  } else if (schema !== undefined) {
    v = inlineRef(schema, this._opts.inlineRefs)
        ? schema
        : compile.call(this, schema, root, undefined, baseId);
  }

  return v;
}


/**
 * Resolve schema, its root and baseId
 * @this Ajv
 * @param  {Object} root root object with properties schema, refVal, refs
 * @param  {String} ref  reference to resolve
 * @return {Object} object with properties schema, root, baseId
 */
function resolveSchema(root, ref) {
  /* jshint validthis: true */
  var p = URI.parse(ref)
    , refPath = _getFullPath(p)
    , baseId = getFullPath(this._getId(root.schema));
  if (Object.keys(root.schema).length === 0 || refPath !== baseId) {
    var id = normalizeId(refPath);
    var refVal = this._refs[id];
    if (typeof refVal == 'string') {
      return resolveRecursive.call(this, root, refVal, p);
    } else if (refVal instanceof SchemaObject) {
      if (!refVal.validate) this._compile(refVal);
      root = refVal;
    } else {
      refVal = this._schemas[id];
      if (refVal instanceof SchemaObject) {
        if (!refVal.validate) this._compile(refVal);
        if (id == normalizeId(ref))
          return { schema: refVal, root: root, baseId: baseId };
        root = refVal;
      } else {
        return;
      }
    }
    if (!root.schema) return;
    baseId = getFullPath(this._getId(root.schema));
  }
  return getJsonPointer.call(this, p, baseId, root.schema, root);
}


/* @this Ajv */
function resolveRecursive(root, ref, parsedRef) {
  /* jshint validthis: true */
  var res = resolveSchema.call(this, root, ref);
  if (res) {
    var schema = res.schema;
    var baseId = res.baseId;
    root = res.root;
    var id = this._getId(schema);
    if (id) baseId = resolveUrl(baseId, id);
    return getJsonPointer.call(this, parsedRef, baseId, schema, root);
  }
}


var PREVENT_SCOPE_CHANGE = util.toHash(['properties', 'patternProperties', 'enum', 'dependencies', 'definitions']);
/* @this Ajv */
function getJsonPointer(parsedRef, baseId, schema, root) {
  /* jshint validthis: true */
  parsedRef.fragment = parsedRef.fragment || '';
  if (parsedRef.fragment.slice(0,1) != '/') return;
  var parts = parsedRef.fragment.split('/');

  for (var i = 1; i < parts.length; i++) {
    var part = parts[i];
    if (part) {
      part = util.unescapeFragment(part);
      schema = schema[part];
      if (schema === undefined) break;
      var id;
      if (!PREVENT_SCOPE_CHANGE[part]) {
        id = this._getId(schema);
        if (id) baseId = resolveUrl(baseId, id);
        if (schema.$ref) {
          var $ref = resolveUrl(baseId, schema.$ref);
          var res = resolveSchema.call(this, root, $ref);
          if (res) {
            schema = res.schema;
            root = res.root;
            baseId = res.baseId;
          }
        }
      }
    }
  }
  if (schema !== undefined && schema !== root.schema)
    return { schema: schema, root: root, baseId: baseId };
}


var SIMPLE_INLINED = util.toHash([
  'type', 'format', 'pattern',
  'maxLength', 'minLength',
  'maxProperties', 'minProperties',
  'maxItems', 'minItems',
  'maximum', 'minimum',
  'uniqueItems', 'multipleOf',
  'required', 'enum'
]);
function inlineRef(schema, limit) {
  if (limit === false) return false;
  if (limit === undefined || limit === true) return checkNoRef(schema);
  else if (limit) return countKeys(schema) <= limit;
}


function checkNoRef(schema) {
  var item;
  if (Array.isArray(schema)) {
    for (var i=0; i<schema.length; i++) {
      item = schema[i];
      if (typeof item == 'object' && !checkNoRef(item)) return false;
    }
  } else {
    for (var key in schema) {
      if (key == '$ref') return false;
      item = schema[key];
      if (typeof item == 'object' && !checkNoRef(item)) return false;
    }
  }
  return true;
}


function countKeys(schema) {
  var count = 0, item;
  if (Array.isArray(schema)) {
    for (var i=0; i<schema.length; i++) {
      item = schema[i];
      if (typeof item == 'object') count += countKeys(item);
      if (count == Infinity) return Infinity;
    }
  } else {
    for (var key in schema) {
      if (key == '$ref') return Infinity;
      if (SIMPLE_INLINED[key]) {
        count++;
      } else {
        item = schema[key];
        if (typeof item == 'object') count += countKeys(item) + 1;
        if (count == Infinity) return Infinity;
      }
    }
  }
  return count;
}


function getFullPath(id, normalize) {
  if (normalize !== false) id = normalizeId(id);
  var p = URI.parse(id);
  return _getFullPath(p);
}


function _getFullPath(p) {
  return URI.serialize(p).split('#')[0] + '#';
}


var TRAILING_SLASH_HASH = /#\/?$/;
function normalizeId(id) {
  return id ? id.replace(TRAILING_SLASH_HASH, '') : '';
}


function resolveUrl(baseId, id) {
  id = normalizeId(id);
  return URI.resolve(baseId, id);
}


/* @this Ajv */
function resolveIds(schema) {
  var schemaId = normalizeId(this._getId(schema));
  var baseIds = {'': schemaId};
  var fullPaths = {'': getFullPath(schemaId, false)};
  var localRefs = {};
  var self = this;

  traverse(schema, {allKeys: true}, function(sch, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
    if (jsonPtr === '') return;
    var id = self._getId(sch);
    var baseId = baseIds[parentJsonPtr];
    var fullPath = fullPaths[parentJsonPtr] + '/' + parentKeyword;
    if (keyIndex !== undefined)
      fullPath += '/' + (typeof keyIndex == 'number' ? keyIndex : util.escapeFragment(keyIndex));

    if (typeof id == 'string') {
      id = baseId = normalizeId(baseId ? URI.resolve(baseId, id) : id);

      var refVal = self._refs[id];
      if (typeof refVal == 'string') refVal = self._refs[refVal];
      if (refVal && refVal.schema) {
        if (!equal(sch, refVal.schema))
          throw new Error('id "' + id + '" resolves to more than one schema');
      } else if (id != normalizeId(fullPath)) {
        if (id[0] == '#') {
          if (localRefs[id] && !equal(sch, localRefs[id]))
            throw new Error('id "' + id + '" resolves to more than one schema');
          localRefs[id] = sch;
        } else {
          self._refs[id] = fullPath;
        }
      }
    }
    baseIds[jsonPtr] = baseId;
    fullPaths[jsonPtr] = fullPath;
  });

  return localRefs;
}


/***/ }),

/***/ 8561:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var ruleModules = __webpack_require__(5810)
  , toHash = __webpack_require__(6578).toHash;

module.exports = function rules() {
  var RULES = [
    { type: 'number',
      rules: [ { 'maximum': ['exclusiveMaximum'] },
               { 'minimum': ['exclusiveMinimum'] }, 'multipleOf', 'format'] },
    { type: 'string',
      rules: [ 'maxLength', 'minLength', 'pattern', 'format' ] },
    { type: 'array',
      rules: [ 'maxItems', 'minItems', 'items', 'contains', 'uniqueItems' ] },
    { type: 'object',
      rules: [ 'maxProperties', 'minProperties', 'required', 'dependencies', 'propertyNames',
               { 'properties': ['additionalProperties', 'patternProperties'] } ] },
    { rules: [ '$ref', 'const', 'enum', 'not', 'anyOf', 'oneOf', 'allOf', 'if' ] }
  ];

  var ALL = [ 'type', '$comment' ];
  var KEYWORDS = [
    '$schema', '$id', 'id', '$data', '$async', 'title',
    'description', 'default', 'definitions',
    'examples', 'readOnly', 'writeOnly',
    'contentMediaType', 'contentEncoding',
    'additionalItems', 'then', 'else'
  ];
  var TYPES = [ 'number', 'integer', 'string', 'array', 'object', 'boolean', 'null' ];
  RULES.all = toHash(ALL);
  RULES.types = toHash(TYPES);

  RULES.forEach(function (group) {
    group.rules = group.rules.map(function (keyword) {
      var implKeywords;
      if (typeof keyword == 'object') {
        var key = Object.keys(keyword)[0];
        implKeywords = keyword[key];
        keyword = key;
        implKeywords.forEach(function (k) {
          ALL.push(k);
          RULES.all[k] = true;
        });
      }
      ALL.push(keyword);
      var rule = RULES.all[keyword] = {
        keyword: keyword,
        code: ruleModules[keyword],
        implements: implKeywords
      };
      return rule;
    });

    RULES.all.$comment = {
      keyword: '$comment',
      code: ruleModules.$comment
    };

    if (group.type) RULES.types[group.type] = group;
  });

  RULES.keywords = toHash(ALL.concat(KEYWORDS));
  RULES.custom = {};

  return RULES;
};


/***/ }),

/***/ 7605:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var util = __webpack_require__(6578);

module.exports = SchemaObject;

function SchemaObject(obj) {
  util.copy(obj, this);
}


/***/ }),

/***/ 4580:
/***/ ((module) => {

"use strict";


// https://mathiasbynens.be/notes/javascript-encoding
// https://github.com/bestiejs/punycode.js - punycode.ucs2.decode
module.exports = function ucs2length(str) {
  var length = 0
    , len = str.length
    , pos = 0
    , value;
  while (pos < len) {
    length++;
    value = str.charCodeAt(pos++);
    if (value >= 0xD800 && value <= 0xDBFF && pos < len) {
      // high surrogate, and there is a next character
      value = str.charCodeAt(pos);
      if ((value & 0xFC00) == 0xDC00) pos++; // low surrogate
    }
  }
  return length;
};


/***/ }),

/***/ 6578:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";



module.exports = {
  copy: copy,
  checkDataType: checkDataType,
  checkDataTypes: checkDataTypes,
  coerceToTypes: coerceToTypes,
  toHash: toHash,
  getProperty: getProperty,
  escapeQuotes: escapeQuotes,
  equal: __webpack_require__(8206),
  ucs2length: __webpack_require__(4580),
  varOccurences: varOccurences,
  varReplace: varReplace,
  schemaHasRules: schemaHasRules,
  schemaHasRulesExcept: schemaHasRulesExcept,
  schemaUnknownRules: schemaUnknownRules,
  toQuotedString: toQuotedString,
  getPathExpr: getPathExpr,
  getPath: getPath,
  getData: getData,
  unescapeFragment: unescapeFragment,
  unescapeJsonPointer: unescapeJsonPointer,
  escapeFragment: escapeFragment,
  escapeJsonPointer: escapeJsonPointer
};


function copy(o, to) {
  to = to || {};
  for (var key in o) to[key] = o[key];
  return to;
}


function checkDataType(dataType, data, strictNumbers, negate) {
  var EQUAL = negate ? ' !== ' : ' === '
    , AND = negate ? ' || ' : ' && '
    , OK = negate ? '!' : ''
    , NOT = negate ? '' : '!';
  switch (dataType) {
    case 'null': return data + EQUAL + 'null';
    case 'array': return OK + 'Array.isArray(' + data + ')';
    case 'object': return '(' + OK + data + AND +
                          'typeof ' + data + EQUAL + '"object"' + AND +
                          NOT + 'Array.isArray(' + data + '))';
    case 'integer': return '(typeof ' + data + EQUAL + '"number"' + AND +
                           NOT + '(' + data + ' % 1)' +
                           AND + data + EQUAL + data +
                           (strictNumbers ? (AND + OK + 'isFinite(' + data + ')') : '') + ')';
    case 'number': return '(typeof ' + data + EQUAL + '"' + dataType + '"' +
                          (strictNumbers ? (AND + OK + 'isFinite(' + data + ')') : '') + ')';
    default: return 'typeof ' + data + EQUAL + '"' + dataType + '"';
  }
}


function checkDataTypes(dataTypes, data, strictNumbers) {
  switch (dataTypes.length) {
    case 1: return checkDataType(dataTypes[0], data, strictNumbers, true);
    default:
      var code = '';
      var types = toHash(dataTypes);
      if (types.array && types.object) {
        code = types.null ? '(': '(!' + data + ' || ';
        code += 'typeof ' + data + ' !== "object")';
        delete types.null;
        delete types.array;
        delete types.object;
      }
      if (types.number) delete types.integer;
      for (var t in types)
        code += (code ? ' && ' : '' ) + checkDataType(t, data, strictNumbers, true);

      return code;
  }
}


var COERCE_TO_TYPES = toHash([ 'string', 'number', 'integer', 'boolean', 'null' ]);
function coerceToTypes(optionCoerceTypes, dataTypes) {
  if (Array.isArray(dataTypes)) {
    var types = [];
    for (var i=0; i<dataTypes.length; i++) {
      var t = dataTypes[i];
      if (COERCE_TO_TYPES[t]) types[types.length] = t;
      else if (optionCoerceTypes === 'array' && t === 'array') types[types.length] = t;
    }
    if (types.length) return types;
  } else if (COERCE_TO_TYPES[dataTypes]) {
    return [dataTypes];
  } else if (optionCoerceTypes === 'array' && dataTypes === 'array') {
    return ['array'];
  }
}


function toHash(arr) {
  var hash = {};
  for (var i=0; i<arr.length; i++) hash[arr[i]] = true;
  return hash;
}


var IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
var SINGLE_QUOTE = /'|\\/g;
function getProperty(key) {
  return typeof key == 'number'
          ? '[' + key + ']'
          : IDENTIFIER.test(key)
            ? '.' + key
            : "['" + escapeQuotes(key) + "']";
}


function escapeQuotes(str) {
  return str.replace(SINGLE_QUOTE, '\\$&')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\f/g, '\\f')
            .replace(/\t/g, '\\t');
}


function varOccurences(str, dataVar) {
  dataVar += '[^0-9]';
  var matches = str.match(new RegExp(dataVar, 'g'));
  return matches ? matches.length : 0;
}


function varReplace(str, dataVar, expr) {
  dataVar += '([^0-9])';
  expr = expr.replace(/\$/g, '$$$$');
  return str.replace(new RegExp(dataVar, 'g'), expr + '$1');
}


function schemaHasRules(schema, rules) {
  if (typeof schema == 'boolean') return !schema;
  for (var key in schema) if (rules[key]) return true;
}


function schemaHasRulesExcept(schema, rules, exceptKeyword) {
  if (typeof schema == 'boolean') return !schema && exceptKeyword != 'not';
  for (var key in schema) if (key != exceptKeyword && rules[key]) return true;
}


function schemaUnknownRules(schema, rules) {
  if (typeof schema == 'boolean') return;
  for (var key in schema) if (!rules[key]) return key;
}


function toQuotedString(str) {
  return '\'' + escapeQuotes(str) + '\'';
}


function getPathExpr(currentPath, expr, jsonPointers, isNumber) {
  var path = jsonPointers // false by default
              ? '\'/\' + ' + expr + (isNumber ? '' : '.replace(/~/g, \'~0\').replace(/\\//g, \'~1\')')
              : (isNumber ? '\'[\' + ' + expr + ' + \']\'' : '\'[\\\'\' + ' + expr + ' + \'\\\']\'');
  return joinPaths(currentPath, path);
}


function getPath(currentPath, prop, jsonPointers) {
  var path = jsonPointers // false by default
              ? toQuotedString('/' + escapeJsonPointer(prop))
              : toQuotedString(getProperty(prop));
  return joinPaths(currentPath, path);
}


var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function getData($data, lvl, paths) {
  var up, jsonPointer, data, matches;
  if ($data === '') return 'rootData';
  if ($data[0] == '/') {
    if (!JSON_POINTER.test($data)) throw new Error('Invalid JSON-pointer: ' + $data);
    jsonPointer = $data;
    data = 'rootData';
  } else {
    matches = $data.match(RELATIVE_JSON_POINTER);
    if (!matches) throw new Error('Invalid JSON-pointer: ' + $data);
    up = +matches[1];
    jsonPointer = matches[2];
    if (jsonPointer == '#') {
      if (up >= lvl) throw new Error('Cannot access property/index ' + up + ' levels up, current level is ' + lvl);
      return paths[lvl - up];
    }

    if (up > lvl) throw new Error('Cannot access data ' + up + ' levels up, current level is ' + lvl);
    data = 'data' + ((lvl - up) || '');
    if (!jsonPointer) return data;
  }

  var expr = data;
  var segments = jsonPointer.split('/');
  for (var i=0; i<segments.length; i++) {
    var segment = segments[i];
    if (segment) {
      data += getProperty(unescapeJsonPointer(segment));
      expr += ' && ' + data;
    }
  }
  return expr;
}


function joinPaths (a, b) {
  if (a == '""') return b;
  return (a + ' + ' + b).replace(/([^\\])' \+ '/g, '$1');
}


function unescapeFragment(str) {
  return unescapeJsonPointer(decodeURIComponent(str));
}


function escapeFragment(str) {
  return encodeURIComponent(escapeJsonPointer(str));
}


function escapeJsonPointer(str) {
  return str.replace(/~/g, '~0').replace(/\//g, '~1');
}


function unescapeJsonPointer(str) {
  return str.replace(/~1/g, '/').replace(/~0/g, '~');
}


/***/ }),

/***/ 1412:
/***/ ((module) => {

"use strict";


var KEYWORDS = [
  'multipleOf',
  'maximum',
  'exclusiveMaximum',
  'minimum',
  'exclusiveMinimum',
  'maxLength',
  'minLength',
  'pattern',
  'additionalItems',
  'maxItems',
  'minItems',
  'uniqueItems',
  'maxProperties',
  'minProperties',
  'required',
  'additionalProperties',
  'enum',
  'format',
  'const'
];

module.exports = function (metaSchema, keywordsJsonPointers) {
  for (var i=0; i<keywordsJsonPointers.length; i++) {
    metaSchema = JSON.parse(JSON.stringify(metaSchema));
    var segments = keywordsJsonPointers[i].split('/');
    var keywords = metaSchema;
    var j;
    for (j=1; j<segments.length; j++)
      keywords = keywords[segments[j]];

    for (j=0; j<KEYWORDS.length; j++) {
      var key = KEYWORDS[j];
      var schema = keywords[key];
      if (schema) {
        keywords[key] = {
          anyOf: [
            schema,
            { $ref: 'https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#' }
          ]
        };
      }
    }
  }

  return metaSchema;
};


/***/ }),

/***/ 458:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var metaSchema = __webpack_require__(38);

module.exports = {
  $id: 'https://github.com/ajv-validator/ajv/blob/master/lib/definition_schema.js',
  definitions: {
    simpleTypes: metaSchema.definitions.simpleTypes
  },
  type: 'object',
  dependencies: {
    schema: ['validate'],
    $data: ['validate'],
    statements: ['inline'],
    valid: {not: {required: ['macro']}}
  },
  properties: {
    type: metaSchema.properties.type,
    schema: {type: 'boolean'},
    statements: {type: 'boolean'},
    dependencies: {
      type: 'array',
      items: {type: 'string'}
    },
    metaSchema: {type: 'object'},
    modifying: {type: 'boolean'},
    valid: {type: 'boolean'},
    $data: {type: 'boolean'},
    async: {type: 'boolean'},
    errors: {
      anyOf: [
        {type: 'boolean'},
        {const: 'full'}
      ]
    }
  }
};


/***/ }),

/***/ 7404:
/***/ ((module) => {

"use strict";

module.exports = function generate__limit(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $isMax = $keyword == 'maximum',
    $exclusiveKeyword = $isMax ? 'exclusiveMaximum' : 'exclusiveMinimum',
    $schemaExcl = it.schema[$exclusiveKeyword],
    $isDataExcl = it.opts.$data && $schemaExcl && $schemaExcl.$data,
    $op = $isMax ? '<' : '>',
    $notOp = $isMax ? '>' : '<',
    $errorKeyword = undefined;
  if (!($isData || typeof $schema == 'number' || $schema === undefined)) {
    throw new Error($keyword + ' must be number');
  }
  if (!($isDataExcl || $schemaExcl === undefined || typeof $schemaExcl == 'number' || typeof $schemaExcl == 'boolean')) {
    throw new Error($exclusiveKeyword + ' must be number or boolean');
  }
  if ($isDataExcl) {
    var $schemaValueExcl = it.util.getData($schemaExcl.$data, $dataLvl, it.dataPathArr),
      $exclusive = 'exclusive' + $lvl,
      $exclType = 'exclType' + $lvl,
      $exclIsNumber = 'exclIsNumber' + $lvl,
      $opExpr = 'op' + $lvl,
      $opStr = '\' + ' + $opExpr + ' + \'';
    out += ' var schemaExcl' + ($lvl) + ' = ' + ($schemaValueExcl) + '; ';
    $schemaValueExcl = 'schemaExcl' + $lvl;
    out += ' var ' + ($exclusive) + '; var ' + ($exclType) + ' = typeof ' + ($schemaValueExcl) + '; if (' + ($exclType) + ' != \'boolean\' && ' + ($exclType) + ' != \'undefined\' && ' + ($exclType) + ' != \'number\') { ';
    var $errorKeyword = $exclusiveKeyword;
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = ''; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ($errorKeyword || '_exclusiveLimit') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
      if (it.opts.messages !== false) {
        out += ' , message: \'' + ($exclusiveKeyword) + ' should be boolean\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    var __err = out;
    out = $$outStack.pop();
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError([' + (__err) + ']); ';
      } else {
        out += ' validate.errors = [' + (__err) + ']; return false; ';
      }
    } else {
      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    out += ' } else if ( ';
    if ($isData) {
      out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
    }
    out += ' ' + ($exclType) + ' == \'number\' ? ( (' + ($exclusive) + ' = ' + ($schemaValue) + ' === undefined || ' + ($schemaValueExcl) + ' ' + ($op) + '= ' + ($schemaValue) + ') ? ' + ($data) + ' ' + ($notOp) + '= ' + ($schemaValueExcl) + ' : ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' ) : ( (' + ($exclusive) + ' = ' + ($schemaValueExcl) + ' === true) ? ' + ($data) + ' ' + ($notOp) + '= ' + ($schemaValue) + ' : ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' ) || ' + ($data) + ' !== ' + ($data) + ') { var op' + ($lvl) + ' = ' + ($exclusive) + ' ? \'' + ($op) + '\' : \'' + ($op) + '=\'; ';
    if ($schema === undefined) {
      $errorKeyword = $exclusiveKeyword;
      $errSchemaPath = it.errSchemaPath + '/' + $exclusiveKeyword;
      $schemaValue = $schemaValueExcl;
      $isData = $isDataExcl;
    }
  } else {
    var $exclIsNumber = typeof $schemaExcl == 'number',
      $opStr = $op;
    if ($exclIsNumber && $isData) {
      var $opExpr = '\'' + $opStr + '\'';
      out += ' if ( ';
      if ($isData) {
        out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
      }
      out += ' ( ' + ($schemaValue) + ' === undefined || ' + ($schemaExcl) + ' ' + ($op) + '= ' + ($schemaValue) + ' ? ' + ($data) + ' ' + ($notOp) + '= ' + ($schemaExcl) + ' : ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' ) || ' + ($data) + ' !== ' + ($data) + ') { ';
    } else {
      if ($exclIsNumber && $schema === undefined) {
        $exclusive = true;
        $errorKeyword = $exclusiveKeyword;
        $errSchemaPath = it.errSchemaPath + '/' + $exclusiveKeyword;
        $schemaValue = $schemaExcl;
        $notOp += '=';
      } else {
        if ($exclIsNumber) $schemaValue = Math[$isMax ? 'min' : 'max']($schemaExcl, $schema);
        if ($schemaExcl === ($exclIsNumber ? $schemaValue : true)) {
          $exclusive = true;
          $errorKeyword = $exclusiveKeyword;
          $errSchemaPath = it.errSchemaPath + '/' + $exclusiveKeyword;
          $notOp += '=';
        } else {
          $exclusive = false;
          $opStr += '=';
        }
      }
      var $opExpr = '\'' + $opStr + '\'';
      out += ' if ( ';
      if ($isData) {
        out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
      }
      out += ' ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' || ' + ($data) + ' !== ' + ($data) + ') { ';
    }
  }
  $errorKeyword = $errorKeyword || $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_limit') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { comparison: ' + ($opExpr) + ', limit: ' + ($schemaValue) + ', exclusive: ' + ($exclusive) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should be ' + ($opStr) + ' ';
      if ($isData) {
        out += '\' + ' + ($schemaValue);
      } else {
        out += '' + ($schemaValue) + '\'';
      }
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += ' } ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),

/***/ 4683:
/***/ ((module) => {

"use strict";

module.exports = function generate__limitItems(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if (!($isData || typeof $schema == 'number')) {
    throw new Error($keyword + ' must be number');
  }
  var $op = $keyword == 'maxItems' ? '>' : '<';
  out += 'if ( ';
  if ($isData) {
    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
  }
  out += ' ' + ($data) + '.length ' + ($op) + ' ' + ($schemaValue) + ') { ';
  var $errorKeyword = $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_limitItems') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should NOT have ';
      if ($keyword == 'maxItems') {
        out += 'more';
      } else {
        out += 'fewer';
      }
      out += ' than ';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + ($schema);
      }
      out += ' items\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),

/***/ 2114:
/***/ ((module) => {

"use strict";

module.exports = function generate__limitLength(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if (!($isData || typeof $schema == 'number')) {
    throw new Error($keyword + ' must be number');
  }
  var $op = $keyword == 'maxLength' ? '>' : '<';
  out += 'if ( ';
  if ($isData) {
    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
  }
  if (it.opts.unicode === false) {
    out += ' ' + ($data) + '.length ';
  } else {
    out += ' ucs2length(' + ($data) + ') ';
  }
  out += ' ' + ($op) + ' ' + ($schemaValue) + ') { ';
  var $errorKeyword = $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_limitLength') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should NOT be ';
      if ($keyword == 'maxLength') {
        out += 'longer';
      } else {
        out += 'shorter';
      }
      out += ' than ';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + ($schema);
      }
      out += ' characters\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),

/***/ 1142:
/***/ ((module) => {

"use strict";

module.exports = function generate__limitProperties(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if (!($isData || typeof $schema == 'number')) {
    throw new Error($keyword + ' must be number');
  }
  var $op = $keyword == 'maxProperties' ? '>' : '<';
  out += 'if ( ';
  if ($isData) {
    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
  }
  out += ' Object.keys(' + ($data) + ').length ' + ($op) + ' ' + ($schemaValue) + ') { ';
  var $errorKeyword = $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_limitProperties') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should NOT have ';
      if ($keyword == 'maxProperties') {
        out += 'more';
      } else {
        out += 'fewer';
      }
      out += ' than ';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + ($schema);
      }
      out += ' properties\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),

/***/ 9443:
/***/ ((module) => {

"use strict";

module.exports = function generate_allOf(it, $keyword, $ruleType) {
  var out = ' ';
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $currentBaseId = $it.baseId,
    $allSchemasEmpty = true;
  var arr1 = $schema;
  if (arr1) {
    var $sch, $i = -1,
      l1 = arr1.length - 1;
    while ($i < l1) {
      $sch = arr1[$i += 1];
      if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
        $allSchemasEmpty = false;
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + '[' + $i + ']';
        $it.errSchemaPath = $errSchemaPath + '/' + $i;
        out += '  ' + (it.validate($it)) + ' ';
        $it.baseId = $currentBaseId;
        if ($breakOnError) {
          out += ' if (' + ($nextValid) + ') { ';
          $closingBraces += '}';
        }
      }
    }
  }
  if ($breakOnError) {
    if ($allSchemasEmpty) {
      out += ' if (true) { ';
    } else {
      out += ' ' + ($closingBraces.slice(0, -1)) + ' ';
    }
  }
  return out;
}


/***/ }),

/***/ 3093:
/***/ ((module) => {

"use strict";

module.exports = function generate_anyOf(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $noEmptySchema = $schema.every(function($sch) {
    return (it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all));
  });
  if ($noEmptySchema) {
    var $currentBaseId = $it.baseId;
    out += ' var ' + ($errs) + ' = errors; var ' + ($valid) + ' = false;  ';
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    var arr1 = $schema;
    if (arr1) {
      var $sch, $i = -1,
        l1 = arr1.length - 1;
      while ($i < l1) {
        $sch = arr1[$i += 1];
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + '[' + $i + ']';
        $it.errSchemaPath = $errSchemaPath + '/' + $i;
        out += '  ' + (it.validate($it)) + ' ';
        $it.baseId = $currentBaseId;
        out += ' ' + ($valid) + ' = ' + ($valid) + ' || ' + ($nextValid) + '; if (!' + ($valid) + ') { ';
        $closingBraces += '}';
      }
    }
    it.compositeRule = $it.compositeRule = $wasComposite;
    out += ' ' + ($closingBraces) + ' if (!' + ($valid) + ') {   var err =   '; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('anyOf') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should match some schema in anyOf\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError(vErrors); ';
      } else {
        out += ' validate.errors = vErrors; return false; ';
      }
    }
    out += ' } else {  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } ';
    if (it.opts.allErrors) {
      out += ' } ';
    }
  } else {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
  }
  return out;
}


/***/ }),

/***/ 134:
/***/ ((module) => {

"use strict";

module.exports = function generate_comment(it, $keyword, $ruleType) {
  var out = ' ';
  var $schema = it.schema[$keyword];
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $comment = it.util.toQuotedString($schema);
  if (it.opts.$comment === true) {
    out += ' console.log(' + ($comment) + ');';
  } else if (typeof it.opts.$comment == 'function') {
    out += ' self._opts.$comment(' + ($comment) + ', ' + (it.util.toQuotedString($errSchemaPath)) + ', validate.root.schema);';
  }
  return out;
}


/***/ }),

/***/ 1661:
/***/ ((module) => {

"use strict";

module.exports = function generate_const(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if (!$isData) {
    out += ' var schema' + ($lvl) + ' = validate.schema' + ($schemaPath) + ';';
  }
  out += 'var ' + ($valid) + ' = equal(' + ($data) + ', schema' + ($lvl) + '); if (!' + ($valid) + ') {   ';
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('const') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { allowedValue: schema' + ($lvl) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should be equal to constant\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += ' }';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),

/***/ 5964:
/***/ ((module) => {

"use strict";

module.exports = function generate_contains(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $idx = 'i' + $lvl,
    $dataNxt = $it.dataLevel = it.dataLevel + 1,
    $nextData = 'data' + $dataNxt,
    $currentBaseId = it.baseId,
    $nonEmptySchema = (it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all));
  out += 'var ' + ($errs) + ' = errors;var ' + ($valid) + ';';
  if ($nonEmptySchema) {
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    $it.errSchemaPath = $errSchemaPath;
    out += ' var ' + ($nextValid) + ' = false; for (var ' + ($idx) + ' = 0; ' + ($idx) + ' < ' + ($data) + '.length; ' + ($idx) + '++) { ';
    $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
    var $passData = $data + '[' + $idx + ']';
    $it.dataPathArr[$dataNxt] = $idx;
    var $code = it.validate($it);
    $it.baseId = $currentBaseId;
    if (it.util.varOccurences($code, $nextData) < 2) {
      out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
    } else {
      out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
    }
    out += ' if (' + ($nextValid) + ') break; }  ';
    it.compositeRule = $it.compositeRule = $wasComposite;
    out += ' ' + ($closingBraces) + ' if (!' + ($nextValid) + ') {';
  } else {
    out += ' if (' + ($data) + '.length == 0) {';
  }
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('contains') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should contain a valid item\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += ' } else { ';
  if ($nonEmptySchema) {
    out += '  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } ';
  }
  if (it.opts.allErrors) {
    out += ' } ';
  }
  return out;
}


/***/ }),

/***/ 5912:
/***/ ((module) => {

"use strict";

module.exports = function generate_custom(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $rule = this,
    $definition = 'definition' + $lvl,
    $rDef = $rule.definition,
    $closingBraces = '';
  var $compile, $inline, $macro, $ruleValidate, $validateCode;
  if ($isData && $rDef.$data) {
    $validateCode = 'keywordValidate' + $lvl;
    var $validateSchema = $rDef.validateSchema;
    out += ' var ' + ($definition) + ' = RULES.custom[\'' + ($keyword) + '\'].definition; var ' + ($validateCode) + ' = ' + ($definition) + '.validate;';
  } else {
    $ruleValidate = it.useCustomRule($rule, $schema, it.schema, it);
    if (!$ruleValidate) return;
    $schemaValue = 'validate.schema' + $schemaPath;
    $validateCode = $ruleValidate.code;
    $compile = $rDef.compile;
    $inline = $rDef.inline;
    $macro = $rDef.macro;
  }
  var $ruleErrs = $validateCode + '.errors',
    $i = 'i' + $lvl,
    $ruleErr = 'ruleErr' + $lvl,
    $asyncKeyword = $rDef.async;
  if ($asyncKeyword && !it.async) throw new Error('async keyword in sync schema');
  if (!($inline || $macro)) {
    out += '' + ($ruleErrs) + ' = null;';
  }
  out += 'var ' + ($errs) + ' = errors;var ' + ($valid) + ';';
  if ($isData && $rDef.$data) {
    $closingBraces += '}';
    out += ' if (' + ($schemaValue) + ' === undefined) { ' + ($valid) + ' = true; } else { ';
    if ($validateSchema) {
      $closingBraces += '}';
      out += ' ' + ($valid) + ' = ' + ($definition) + '.validateSchema(' + ($schemaValue) + '); if (' + ($valid) + ') { ';
    }
  }
  if ($inline) {
    if ($rDef.statements) {
      out += ' ' + ($ruleValidate.validate) + ' ';
    } else {
      out += ' ' + ($valid) + ' = ' + ($ruleValidate.validate) + '; ';
    }
  } else if ($macro) {
    var $it = it.util.copy(it);
    var $closingBraces = '';
    $it.level++;
    var $nextValid = 'valid' + $it.level;
    $it.schema = $ruleValidate.validate;
    $it.schemaPath = '';
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    var $code = it.validate($it).replace(/validate\.schema/g, $validateCode);
    it.compositeRule = $it.compositeRule = $wasComposite;
    out += ' ' + ($code);
  } else {
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = '';
    out += '  ' + ($validateCode) + '.call( ';
    if (it.opts.passContext) {
      out += 'this';
    } else {
      out += 'self';
    }
    if ($compile || $rDef.schema === false) {
      out += ' , ' + ($data) + ' ';
    } else {
      out += ' , ' + ($schemaValue) + ' , ' + ($data) + ' , validate.schema' + (it.schemaPath) + ' ';
    }
    out += ' , (dataPath || \'\')';
    if (it.errorPath != '""') {
      out += ' + ' + (it.errorPath);
    }
    var $parentData = $dataLvl ? 'data' + (($dataLvl - 1) || '') : 'parentData',
      $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : 'parentDataProperty';
    out += ' , ' + ($parentData) + ' , ' + ($parentDataProperty) + ' , rootData )  ';
    var def_callRuleValidate = out;
    out = $$outStack.pop();
    if ($rDef.errors === false) {
      out += ' ' + ($valid) + ' = ';
      if ($asyncKeyword) {
        out += 'await ';
      }
      out += '' + (def_callRuleValidate) + '; ';
    } else {
      if ($asyncKeyword) {
        $ruleErrs = 'customErrors' + $lvl;
        out += ' var ' + ($ruleErrs) + ' = null; try { ' + ($valid) + ' = await ' + (def_callRuleValidate) + '; } catch (e) { ' + ($valid) + ' = false; if (e instanceof ValidationError) ' + ($ruleErrs) + ' = e.errors; else throw e; } ';
      } else {
        out += ' ' + ($ruleErrs) + ' = null; ' + ($valid) + ' = ' + (def_callRuleValidate) + '; ';
      }
    }
  }
  if ($rDef.modifying) {
    out += ' if (' + ($parentData) + ') ' + ($data) + ' = ' + ($parentData) + '[' + ($parentDataProperty) + '];';
  }
  out += '' + ($closingBraces);
  if ($rDef.valid) {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
  } else {
    out += ' if ( ';
    if ($rDef.valid === undefined) {
      out += ' !';
      if ($macro) {
        out += '' + ($nextValid);
      } else {
        out += '' + ($valid);
      }
    } else {
      out += ' ' + (!$rDef.valid) + ' ';
    }
    out += ') { ';
    $errorKeyword = $rule.keyword;
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = '';
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = ''; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ($errorKeyword || 'custom') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { keyword: \'' + ($rule.keyword) + '\' } ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should pass "' + ($rule.keyword) + '" keyword validation\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    var __err = out;
    out = $$outStack.pop();
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError([' + (__err) + ']); ';
      } else {
        out += ' validate.errors = [' + (__err) + ']; return false; ';
      }
    } else {
      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    var def_customError = out;
    out = $$outStack.pop();
    if ($inline) {
      if ($rDef.errors) {
        if ($rDef.errors != 'full') {
          out += '  for (var ' + ($i) + '=' + ($errs) + '; ' + ($i) + '<errors; ' + ($i) + '++) { var ' + ($ruleErr) + ' = vErrors[' + ($i) + ']; if (' + ($ruleErr) + '.dataPath === undefined) ' + ($ruleErr) + '.dataPath = (dataPath || \'\') + ' + (it.errorPath) + '; if (' + ($ruleErr) + '.schemaPath === undefined) { ' + ($ruleErr) + '.schemaPath = "' + ($errSchemaPath) + '"; } ';
          if (it.opts.verbose) {
            out += ' ' + ($ruleErr) + '.schema = ' + ($schemaValue) + '; ' + ($ruleErr) + '.data = ' + ($data) + '; ';
          }
          out += ' } ';
        }
      } else {
        if ($rDef.errors === false) {
          out += ' ' + (def_customError) + ' ';
        } else {
          out += ' if (' + ($errs) + ' == errors) { ' + (def_customError) + ' } else {  for (var ' + ($i) + '=' + ($errs) + '; ' + ($i) + '<errors; ' + ($i) + '++) { var ' + ($ruleErr) + ' = vErrors[' + ($i) + ']; if (' + ($ruleErr) + '.dataPath === undefined) ' + ($ruleErr) + '.dataPath = (dataPath || \'\') + ' + (it.errorPath) + '; if (' + ($ruleErr) + '.schemaPath === undefined) { ' + ($ruleErr) + '.schemaPath = "' + ($errSchemaPath) + '"; } ';
          if (it.opts.verbose) {
            out += ' ' + ($ruleErr) + '.schema = ' + ($schemaValue) + '; ' + ($ruleErr) + '.data = ' + ($data) + '; ';
          }
          out += ' } } ';
        }
      }
    } else if ($macro) {
      out += '   var err =   '; /* istanbul ignore else */
      if (it.createErrors !== false) {
        out += ' { keyword: \'' + ($errorKeyword || 'custom') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { keyword: \'' + ($rule.keyword) + '\' } ';
        if (it.opts.messages !== false) {
          out += ' , message: \'should pass "' + ($rule.keyword) + '" keyword validation\' ';
        }
        if (it.opts.verbose) {
          out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
        }
        out += ' } ';
      } else {
        out += ' {} ';
      }
      out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
      if (!it.compositeRule && $breakOnError) {
        /* istanbul ignore if */
        if (it.async) {
          out += ' throw new ValidationError(vErrors); ';
        } else {
          out += ' validate.errors = vErrors; return false; ';
        }
      }
    } else {
      if ($rDef.errors === false) {
        out += ' ' + (def_customError) + ' ';
      } else {
        out += ' if (Array.isArray(' + ($ruleErrs) + ')) { if (vErrors === null) vErrors = ' + ($ruleErrs) + '; else vErrors = vErrors.concat(' + ($ruleErrs) + '); errors = vErrors.length;  for (var ' + ($i) + '=' + ($errs) + '; ' + ($i) + '<errors; ' + ($i) + '++) { var ' + ($ruleErr) + ' = vErrors[' + ($i) + ']; if (' + ($ruleErr) + '.dataPath === undefined) ' + ($ruleErr) + '.dataPath = (dataPath || \'\') + ' + (it.errorPath) + ';  ' + ($ruleErr) + '.schemaPath = "' + ($errSchemaPath) + '";  ';
        if (it.opts.verbose) {
          out += ' ' + ($ruleErr) + '.schema = ' + ($schemaValue) + '; ' + ($ruleErr) + '.data = ' + ($data) + '; ';
        }
        out += ' } } else { ' + (def_customError) + ' } ';
      }
    }
    out += ' } ';
    if ($breakOnError) {
      out += ' else { ';
    }
  }
  return out;
}


/***/ }),

/***/ 2591:
/***/ ((module) => {

"use strict";

module.exports = function generate_dependencies(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $schemaDeps = {},
    $propertyDeps = {},
    $ownProperties = it.opts.ownProperties;
  for ($property in $schema) {
    if ($property == '__proto__') continue;
    var $sch = $schema[$property];
    var $deps = Array.isArray($sch) ? $propertyDeps : $schemaDeps;
    $deps[$property] = $sch;
  }
  out += 'var ' + ($errs) + ' = errors;';
  var $currentErrorPath = it.errorPath;
  out += 'var missing' + ($lvl) + ';';
  for (var $property in $propertyDeps) {
    $deps = $propertyDeps[$property];
    if ($deps.length) {
      out += ' if ( ' + ($data) + (it.util.getProperty($property)) + ' !== undefined ';
      if ($ownProperties) {
        out += ' && Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($property)) + '\') ';
      }
      if ($breakOnError) {
        out += ' && ( ';
        var arr1 = $deps;
        if (arr1) {
          var $propertyKey, $i = -1,
            l1 = arr1.length - 1;
          while ($i < l1) {
            $propertyKey = arr1[$i += 1];
            if ($i) {
              out += ' || ';
            }
            var $prop = it.util.getProperty($propertyKey),
              $useData = $data + $prop;
            out += ' ( ( ' + ($useData) + ' === undefined ';
            if ($ownProperties) {
              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
            }
            out += ') && (missing' + ($lvl) + ' = ' + (it.util.toQuotedString(it.opts.jsonPointers ? $propertyKey : $prop)) + ') ) ';
          }
        }
        out += ')) {  ';
        var $propertyPath = 'missing' + $lvl,
          $missingProperty = '\' + ' + $propertyPath + ' + \'';
        if (it.opts._errorDataPathProperty) {
          it.errorPath = it.opts.jsonPointers ? it.util.getPathExpr($currentErrorPath, $propertyPath, true) : $currentErrorPath + ' + ' + $propertyPath;
        }
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ('dependencies') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { property: \'' + (it.util.escapeQuotes($property)) + '\', missingProperty: \'' + ($missingProperty) + '\', depsCount: ' + ($deps.length) + ', deps: \'' + (it.util.escapeQuotes($deps.length == 1 ? $deps[0] : $deps.join(", "))) + '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'should have ';
            if ($deps.length == 1) {
              out += 'property ' + (it.util.escapeQuotes($deps[0]));
            } else {
              out += 'properties ' + (it.util.escapeQuotes($deps.join(", ")));
            }
            out += ' when property ' + (it.util.escapeQuotes($property)) + ' is present\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
      } else {
        out += ' ) { ';
        var arr2 = $deps;
        if (arr2) {
          var $propertyKey, i2 = -1,
            l2 = arr2.length - 1;
          while (i2 < l2) {
            $propertyKey = arr2[i2 += 1];
            var $prop = it.util.getProperty($propertyKey),
              $missingProperty = it.util.escapeQuotes($propertyKey),
              $useData = $data + $prop;
            if (it.opts._errorDataPathProperty) {
              it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
            }
            out += ' if ( ' + ($useData) + ' === undefined ';
            if ($ownProperties) {
              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
            }
            out += ') {  var err =   '; /* istanbul ignore else */
            if (it.createErrors !== false) {
              out += ' { keyword: \'' + ('dependencies') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { property: \'' + (it.util.escapeQuotes($property)) + '\', missingProperty: \'' + ($missingProperty) + '\', depsCount: ' + ($deps.length) + ', deps: \'' + (it.util.escapeQuotes($deps.length == 1 ? $deps[0] : $deps.join(", "))) + '\' } ';
              if (it.opts.messages !== false) {
                out += ' , message: \'should have ';
                if ($deps.length == 1) {
                  out += 'property ' + (it.util.escapeQuotes($deps[0]));
                } else {
                  out += 'properties ' + (it.util.escapeQuotes($deps.join(", ")));
                }
                out += ' when property ' + (it.util.escapeQuotes($property)) + ' is present\' ';
              }
              if (it.opts.verbose) {
                out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
              }
              out += ' } ';
            } else {
              out += ' {} ';
            }
            out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ';
          }
        }
      }
      out += ' }   ';
      if ($breakOnError) {
        $closingBraces += '}';
        out += ' else { ';
      }
    }
  }
  it.errorPath = $currentErrorPath;
  var $currentBaseId = $it.baseId;
  for (var $property in $schemaDeps) {
    var $sch = $schemaDeps[$property];
    if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
      out += ' ' + ($nextValid) + ' = true; if ( ' + ($data) + (it.util.getProperty($property)) + ' !== undefined ';
      if ($ownProperties) {
        out += ' && Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($property)) + '\') ';
      }
      out += ') { ';
      $it.schema = $sch;
      $it.schemaPath = $schemaPath + it.util.getProperty($property);
      $it.errSchemaPath = $errSchemaPath + '/' + it.util.escapeFragment($property);
      out += '  ' + (it.validate($it)) + ' ';
      $it.baseId = $currentBaseId;
      out += ' }  ';
      if ($breakOnError) {
        out += ' if (' + ($nextValid) + ') { ';
        $closingBraces += '}';
      }
    }
  }
  if ($breakOnError) {
    out += '   ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  return out;
}


/***/ }),

/***/ 163:
/***/ ((module) => {

"use strict";

module.exports = function generate_enum(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $i = 'i' + $lvl,
    $vSchema = 'schema' + $lvl;
  if (!$isData) {
    out += ' var ' + ($vSchema) + ' = validate.schema' + ($schemaPath) + ';';
  }
  out += 'var ' + ($valid) + ';';
  if ($isData) {
    out += ' if (schema' + ($lvl) + ' === undefined) ' + ($valid) + ' = true; else if (!Array.isArray(schema' + ($lvl) + ')) ' + ($valid) + ' = false; else {';
  }
  out += '' + ($valid) + ' = false;for (var ' + ($i) + '=0; ' + ($i) + '<' + ($vSchema) + '.length; ' + ($i) + '++) if (equal(' + ($data) + ', ' + ($vSchema) + '[' + ($i) + '])) { ' + ($valid) + ' = true; break; }';
  if ($isData) {
    out += '  }  ';
  }
  out += ' if (!' + ($valid) + ') {   ';
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('enum') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { allowedValues: schema' + ($lvl) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should be equal to one of the allowed values\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += ' }';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),

/***/ 3847:
/***/ ((module) => {

"use strict";

module.exports = function generate_format(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  if (it.opts.format === false) {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
    return out;
  }
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $unknownFormats = it.opts.unknownFormats,
    $allowUnknown = Array.isArray($unknownFormats);
  if ($isData) {
    var $format = 'format' + $lvl,
      $isObject = 'isObject' + $lvl,
      $formatType = 'formatType' + $lvl;
    out += ' var ' + ($format) + ' = formats[' + ($schemaValue) + ']; var ' + ($isObject) + ' = typeof ' + ($format) + ' == \'object\' && !(' + ($format) + ' instanceof RegExp) && ' + ($format) + '.validate; var ' + ($formatType) + ' = ' + ($isObject) + ' && ' + ($format) + '.type || \'string\'; if (' + ($isObject) + ') { ';
    if (it.async) {
      out += ' var async' + ($lvl) + ' = ' + ($format) + '.async; ';
    }
    out += ' ' + ($format) + ' = ' + ($format) + '.validate; } if (  ';
    if ($isData) {
      out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'string\') || ';
    }
    out += ' (';
    if ($unknownFormats != 'ignore') {
      out += ' (' + ($schemaValue) + ' && !' + ($format) + ' ';
      if ($allowUnknown) {
        out += ' && self._opts.unknownFormats.indexOf(' + ($schemaValue) + ') == -1 ';
      }
      out += ') || ';
    }
    out += ' (' + ($format) + ' && ' + ($formatType) + ' == \'' + ($ruleType) + '\' && !(typeof ' + ($format) + ' == \'function\' ? ';
    if (it.async) {
      out += ' (async' + ($lvl) + ' ? await ' + ($format) + '(' + ($data) + ') : ' + ($format) + '(' + ($data) + ')) ';
    } else {
      out += ' ' + ($format) + '(' + ($data) + ') ';
    }
    out += ' : ' + ($format) + '.test(' + ($data) + '))))) {';
  } else {
    var $format = it.formats[$schema];
    if (!$format) {
      if ($unknownFormats == 'ignore') {
        it.logger.warn('unknown format "' + $schema + '" ignored in schema at path "' + it.errSchemaPath + '"');
        if ($breakOnError) {
          out += ' if (true) { ';
        }
        return out;
      } else if ($allowUnknown && $unknownFormats.indexOf($schema) >= 0) {
        if ($breakOnError) {
          out += ' if (true) { ';
        }
        return out;
      } else {
        throw new Error('unknown format "' + $schema + '" is used in schema at path "' + it.errSchemaPath + '"');
      }
    }
    var $isObject = typeof $format == 'object' && !($format instanceof RegExp) && $format.validate;
    var $formatType = $isObject && $format.type || 'string';
    if ($isObject) {
      var $async = $format.async === true;
      $format = $format.validate;
    }
    if ($formatType != $ruleType) {
      if ($breakOnError) {
        out += ' if (true) { ';
      }
      return out;
    }
    if ($async) {
      if (!it.async) throw new Error('async format in sync schema');
      var $formatRef = 'formats' + it.util.getProperty($schema) + '.validate';
      out += ' if (!(await ' + ($formatRef) + '(' + ($data) + '))) { ';
    } else {
      out += ' if (! ';
      var $formatRef = 'formats' + it.util.getProperty($schema);
      if ($isObject) $formatRef += '.validate';
      if (typeof $format == 'function') {
        out += ' ' + ($formatRef) + '(' + ($data) + ') ';
      } else {
        out += ' ' + ($formatRef) + '.test(' + ($data) + ') ';
      }
      out += ') { ';
    }
  }
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('format') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { format:  ';
    if ($isData) {
      out += '' + ($schemaValue);
    } else {
      out += '' + (it.util.toQuotedString($schema));
    }
    out += '  } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should match format "';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + (it.util.escapeQuotes($schema));
      }
      out += '"\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + (it.util.toQuotedString($schema));
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += ' } ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),

/***/ 862:
/***/ ((module) => {

"use strict";

module.exports = function generate_if(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $thenSch = it.schema['then'],
    $elseSch = it.schema['else'],
    $thenPresent = $thenSch !== undefined && (it.opts.strictKeywords ? (typeof $thenSch == 'object' && Object.keys($thenSch).length > 0) || $thenSch === false : it.util.schemaHasRules($thenSch, it.RULES.all)),
    $elsePresent = $elseSch !== undefined && (it.opts.strictKeywords ? (typeof $elseSch == 'object' && Object.keys($elseSch).length > 0) || $elseSch === false : it.util.schemaHasRules($elseSch, it.RULES.all)),
    $currentBaseId = $it.baseId;
  if ($thenPresent || $elsePresent) {
    var $ifClause;
    $it.createErrors = false;
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    $it.errSchemaPath = $errSchemaPath;
    out += ' var ' + ($errs) + ' = errors; var ' + ($valid) + ' = true;  ';
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    out += '  ' + (it.validate($it)) + ' ';
    $it.baseId = $currentBaseId;
    $it.createErrors = true;
    out += '  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; }  ';
    it.compositeRule = $it.compositeRule = $wasComposite;
    if ($thenPresent) {
      out += ' if (' + ($nextValid) + ') {  ';
      $it.schema = it.schema['then'];
      $it.schemaPath = it.schemaPath + '.then';
      $it.errSchemaPath = it.errSchemaPath + '/then';
      out += '  ' + (it.validate($it)) + ' ';
      $it.baseId = $currentBaseId;
      out += ' ' + ($valid) + ' = ' + ($nextValid) + '; ';
      if ($thenPresent && $elsePresent) {
        $ifClause = 'ifClause' + $lvl;
        out += ' var ' + ($ifClause) + ' = \'then\'; ';
      } else {
        $ifClause = '\'then\'';
      }
      out += ' } ';
      if ($elsePresent) {
        out += ' else { ';
      }
    } else {
      out += ' if (!' + ($nextValid) + ') { ';
    }
    if ($elsePresent) {
      $it.schema = it.schema['else'];
      $it.schemaPath = it.schemaPath + '.else';
      $it.errSchemaPath = it.errSchemaPath + '/else';
      out += '  ' + (it.validate($it)) + ' ';
      $it.baseId = $currentBaseId;
      out += ' ' + ($valid) + ' = ' + ($nextValid) + '; ';
      if ($thenPresent && $elsePresent) {
        $ifClause = 'ifClause' + $lvl;
        out += ' var ' + ($ifClause) + ' = \'else\'; ';
      } else {
        $ifClause = '\'else\'';
      }
      out += ' } ';
    }
    out += ' if (!' + ($valid) + ') {   var err =   '; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('if') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { failingKeyword: ' + ($ifClause) + ' } ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should match "\' + ' + ($ifClause) + ' + \'" schema\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError(vErrors); ';
      } else {
        out += ' validate.errors = vErrors; return false; ';
      }
    }
    out += ' }   ';
    if ($breakOnError) {
      out += ' else { ';
    }
  } else {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
  }
  return out;
}


/***/ }),

/***/ 5810:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


//all requires must be explicit because browserify won't work with dynamic requires
module.exports = {
  '$ref': __webpack_require__(2393),
  allOf: __webpack_require__(9443),
  anyOf: __webpack_require__(3093),
  '$comment': __webpack_require__(134),
  const: __webpack_require__(1661),
  contains: __webpack_require__(5964),
  dependencies: __webpack_require__(2591),
  'enum': __webpack_require__(163),
  format: __webpack_require__(3847),
  'if': __webpack_require__(862),
  items: __webpack_require__(4408),
  maximum: __webpack_require__(7404),
  minimum: __webpack_require__(7404),
  maxItems: __webpack_require__(4683),
  minItems: __webpack_require__(4683),
  maxLength: __webpack_require__(2114),
  minLength: __webpack_require__(2114),
  maxProperties: __webpack_require__(1142),
  minProperties: __webpack_require__(1142),
  multipleOf: __webpack_require__(9772),
  not: __webpack_require__(750),
  oneOf: __webpack_require__(6106),
  pattern: __webpack_require__(3912),
  properties: __webpack_require__(2924),
  propertyNames: __webpack_require__(9195),
  required: __webpack_require__(8420),
  uniqueItems: __webpack_require__(4995),
  validate: __webpack_require__(9585)
};


/***/ }),

/***/ 4408:
/***/ ((module) => {

"use strict";

module.exports = function generate_items(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $idx = 'i' + $lvl,
    $dataNxt = $it.dataLevel = it.dataLevel + 1,
    $nextData = 'data' + $dataNxt,
    $currentBaseId = it.baseId;
  out += 'var ' + ($errs) + ' = errors;var ' + ($valid) + ';';
  if (Array.isArray($schema)) {
    var $additionalItems = it.schema.additionalItems;
    if ($additionalItems === false) {
      out += ' ' + ($valid) + ' = ' + ($data) + '.length <= ' + ($schema.length) + '; ';
      var $currErrSchemaPath = $errSchemaPath;
      $errSchemaPath = it.errSchemaPath + '/additionalItems';
      out += '  if (!' + ($valid) + ') {   ';
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = ''; /* istanbul ignore else */
      if (it.createErrors !== false) {
        out += ' { keyword: \'' + ('additionalItems') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schema.length) + ' } ';
        if (it.opts.messages !== false) {
          out += ' , message: \'should NOT have more than ' + ($schema.length) + ' items\' ';
        }
        if (it.opts.verbose) {
          out += ' , schema: false , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
        }
        out += ' } ';
      } else {
        out += ' {} ';
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        /* istanbul ignore if */
        if (it.async) {
          out += ' throw new ValidationError([' + (__err) + ']); ';
        } else {
          out += ' validate.errors = [' + (__err) + ']; return false; ';
        }
      } else {
        out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
      }
      out += ' } ';
      $errSchemaPath = $currErrSchemaPath;
      if ($breakOnError) {
        $closingBraces += '}';
        out += ' else { ';
      }
    }
    var arr1 = $schema;
    if (arr1) {
      var $sch, $i = -1,
        l1 = arr1.length - 1;
      while ($i < l1) {
        $sch = arr1[$i += 1];
        if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
          out += ' ' + ($nextValid) + ' = true; if (' + ($data) + '.length > ' + ($i) + ') { ';
          var $passData = $data + '[' + $i + ']';
          $it.schema = $sch;
          $it.schemaPath = $schemaPath + '[' + $i + ']';
          $it.errSchemaPath = $errSchemaPath + '/' + $i;
          $it.errorPath = it.util.getPathExpr(it.errorPath, $i, it.opts.jsonPointers, true);
          $it.dataPathArr[$dataNxt] = $i;
          var $code = it.validate($it);
          $it.baseId = $currentBaseId;
          if (it.util.varOccurences($code, $nextData) < 2) {
            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
          } else {
            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
          }
          out += ' }  ';
          if ($breakOnError) {
            out += ' if (' + ($nextValid) + ') { ';
            $closingBraces += '}';
          }
        }
      }
    }
    if (typeof $additionalItems == 'object' && (it.opts.strictKeywords ? (typeof $additionalItems == 'object' && Object.keys($additionalItems).length > 0) || $additionalItems === false : it.util.schemaHasRules($additionalItems, it.RULES.all))) {
      $it.schema = $additionalItems;
      $it.schemaPath = it.schemaPath + '.additionalItems';
      $it.errSchemaPath = it.errSchemaPath + '/additionalItems';
      out += ' ' + ($nextValid) + ' = true; if (' + ($data) + '.length > ' + ($schema.length) + ') {  for (var ' + ($idx) + ' = ' + ($schema.length) + '; ' + ($idx) + ' < ' + ($data) + '.length; ' + ($idx) + '++) { ';
      $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
      var $passData = $data + '[' + $idx + ']';
      $it.dataPathArr[$dataNxt] = $idx;
      var $code = it.validate($it);
      $it.baseId = $currentBaseId;
      if (it.util.varOccurences($code, $nextData) < 2) {
        out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
      } else {
        out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
      }
      if ($breakOnError) {
        out += ' if (!' + ($nextValid) + ') break; ';
      }
      out += ' } }  ';
      if ($breakOnError) {
        out += ' if (' + ($nextValid) + ') { ';
        $closingBraces += '}';
      }
    }
  } else if ((it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all))) {
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    $it.errSchemaPath = $errSchemaPath;
    out += '  for (var ' + ($idx) + ' = ' + (0) + '; ' + ($idx) + ' < ' + ($data) + '.length; ' + ($idx) + '++) { ';
    $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
    var $passData = $data + '[' + $idx + ']';
    $it.dataPathArr[$dataNxt] = $idx;
    var $code = it.validate($it);
    $it.baseId = $currentBaseId;
    if (it.util.varOccurences($code, $nextData) < 2) {
      out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
    } else {
      out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
    }
    if ($breakOnError) {
      out += ' if (!' + ($nextValid) + ') break; ';
    }
    out += ' }';
  }
  if ($breakOnError) {
    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  return out;
}


/***/ }),

/***/ 9772:
/***/ ((module) => {

"use strict";

module.exports = function generate_multipleOf(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if (!($isData || typeof $schema == 'number')) {
    throw new Error($keyword + ' must be number');
  }
  out += 'var division' + ($lvl) + ';if (';
  if ($isData) {
    out += ' ' + ($schemaValue) + ' !== undefined && ( typeof ' + ($schemaValue) + ' != \'number\' || ';
  }
  out += ' (division' + ($lvl) + ' = ' + ($data) + ' / ' + ($schemaValue) + ', ';
  if (it.opts.multipleOfPrecision) {
    out += ' Math.abs(Math.round(division' + ($lvl) + ') - division' + ($lvl) + ') > 1e-' + (it.opts.multipleOfPrecision) + ' ';
  } else {
    out += ' division' + ($lvl) + ' !== parseInt(division' + ($lvl) + ') ';
  }
  out += ' ) ';
  if ($isData) {
    out += '  )  ';
  }
  out += ' ) {   ';
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('multipleOf') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { multipleOf: ' + ($schemaValue) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should be multiple of ';
      if ($isData) {
        out += '\' + ' + ($schemaValue);
      } else {
        out += '' + ($schemaValue) + '\'';
      }
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),

/***/ 750:
/***/ ((module) => {

"use strict";

module.exports = function generate_not(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  if ((it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all))) {
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    $it.errSchemaPath = $errSchemaPath;
    out += ' var ' + ($errs) + ' = errors;  ';
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    $it.createErrors = false;
    var $allErrorsOption;
    if ($it.opts.allErrors) {
      $allErrorsOption = $it.opts.allErrors;
      $it.opts.allErrors = false;
    }
    out += ' ' + (it.validate($it)) + ' ';
    $it.createErrors = true;
    if ($allErrorsOption) $it.opts.allErrors = $allErrorsOption;
    it.compositeRule = $it.compositeRule = $wasComposite;
    out += ' if (' + ($nextValid) + ') {   ';
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = ''; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('not') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should NOT be valid\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    var __err = out;
    out = $$outStack.pop();
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError([' + (__err) + ']); ';
      } else {
        out += ' validate.errors = [' + (__err) + ']; return false; ';
      }
    } else {
      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    out += ' } else {  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } ';
    if (it.opts.allErrors) {
      out += ' } ';
    }
  } else {
    out += '  var err =   '; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('not') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should NOT be valid\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    if ($breakOnError) {
      out += ' if (false) { ';
    }
  }
  return out;
}


/***/ }),

/***/ 6106:
/***/ ((module) => {

"use strict";

module.exports = function generate_oneOf(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $currentBaseId = $it.baseId,
    $prevValid = 'prevValid' + $lvl,
    $passingSchemas = 'passingSchemas' + $lvl;
  out += 'var ' + ($errs) + ' = errors , ' + ($prevValid) + ' = false , ' + ($valid) + ' = false , ' + ($passingSchemas) + ' = null; ';
  var $wasComposite = it.compositeRule;
  it.compositeRule = $it.compositeRule = true;
  var arr1 = $schema;
  if (arr1) {
    var $sch, $i = -1,
      l1 = arr1.length - 1;
    while ($i < l1) {
      $sch = arr1[$i += 1];
      if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + '[' + $i + ']';
        $it.errSchemaPath = $errSchemaPath + '/' + $i;
        out += '  ' + (it.validate($it)) + ' ';
        $it.baseId = $currentBaseId;
      } else {
        out += ' var ' + ($nextValid) + ' = true; ';
      }
      if ($i) {
        out += ' if (' + ($nextValid) + ' && ' + ($prevValid) + ') { ' + ($valid) + ' = false; ' + ($passingSchemas) + ' = [' + ($passingSchemas) + ', ' + ($i) + ']; } else { ';
        $closingBraces += '}';
      }
      out += ' if (' + ($nextValid) + ') { ' + ($valid) + ' = ' + ($prevValid) + ' = true; ' + ($passingSchemas) + ' = ' + ($i) + '; }';
    }
  }
  it.compositeRule = $it.compositeRule = $wasComposite;
  out += '' + ($closingBraces) + 'if (!' + ($valid) + ') {   var err =   '; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('oneOf') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { passingSchemas: ' + ($passingSchemas) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should match exactly one schema in oneOf\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError(vErrors); ';
    } else {
      out += ' validate.errors = vErrors; return false; ';
    }
  }
  out += '} else {  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; }';
  if (it.opts.allErrors) {
    out += ' } ';
  }
  return out;
}


/***/ }),

/***/ 3912:
/***/ ((module) => {

"use strict";

module.exports = function generate_pattern(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $regexp = $isData ? '(new RegExp(' + $schemaValue + '))' : it.usePattern($schema);
  out += 'if ( ';
  if ($isData) {
    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'string\') || ';
  }
  out += ' !' + ($regexp) + '.test(' + ($data) + ') ) {   ';
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('pattern') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { pattern:  ';
    if ($isData) {
      out += '' + ($schemaValue);
    } else {
      out += '' + (it.util.toQuotedString($schema));
    }
    out += '  } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should match pattern "';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + (it.util.escapeQuotes($schema));
      }
      out += '"\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + (it.util.toQuotedString($schema));
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),

/***/ 2924:
/***/ ((module) => {

"use strict";

module.exports = function generate_properties(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $key = 'key' + $lvl,
    $idx = 'idx' + $lvl,
    $dataNxt = $it.dataLevel = it.dataLevel + 1,
    $nextData = 'data' + $dataNxt,
    $dataProperties = 'dataProperties' + $lvl;
  var $schemaKeys = Object.keys($schema || {}).filter(notProto),
    $pProperties = it.schema.patternProperties || {},
    $pPropertyKeys = Object.keys($pProperties).filter(notProto),
    $aProperties = it.schema.additionalProperties,
    $someProperties = $schemaKeys.length || $pPropertyKeys.length,
    $noAdditional = $aProperties === false,
    $additionalIsSchema = typeof $aProperties == 'object' && Object.keys($aProperties).length,
    $removeAdditional = it.opts.removeAdditional,
    $checkAdditional = $noAdditional || $additionalIsSchema || $removeAdditional,
    $ownProperties = it.opts.ownProperties,
    $currentBaseId = it.baseId;
  var $required = it.schema.required;
  if ($required && !(it.opts.$data && $required.$data) && $required.length < it.opts.loopRequired) {
    var $requiredHash = it.util.toHash($required);
  }

  function notProto(p) {
    return p !== '__proto__';
  }
  out += 'var ' + ($errs) + ' = errors;var ' + ($nextValid) + ' = true;';
  if ($ownProperties) {
    out += ' var ' + ($dataProperties) + ' = undefined;';
  }
  if ($checkAdditional) {
    if ($ownProperties) {
      out += ' ' + ($dataProperties) + ' = ' + ($dataProperties) + ' || Object.keys(' + ($data) + '); for (var ' + ($idx) + '=0; ' + ($idx) + '<' + ($dataProperties) + '.length; ' + ($idx) + '++) { var ' + ($key) + ' = ' + ($dataProperties) + '[' + ($idx) + ']; ';
    } else {
      out += ' for (var ' + ($key) + ' in ' + ($data) + ') { ';
    }
    if ($someProperties) {
      out += ' var isAdditional' + ($lvl) + ' = !(false ';
      if ($schemaKeys.length) {
        if ($schemaKeys.length > 8) {
          out += ' || validate.schema' + ($schemaPath) + '.hasOwnProperty(' + ($key) + ') ';
        } else {
          var arr1 = $schemaKeys;
          if (arr1) {
            var $propertyKey, i1 = -1,
              l1 = arr1.length - 1;
            while (i1 < l1) {
              $propertyKey = arr1[i1 += 1];
              out += ' || ' + ($key) + ' == ' + (it.util.toQuotedString($propertyKey)) + ' ';
            }
          }
        }
      }
      if ($pPropertyKeys.length) {
        var arr2 = $pPropertyKeys;
        if (arr2) {
          var $pProperty, $i = -1,
            l2 = arr2.length - 1;
          while ($i < l2) {
            $pProperty = arr2[$i += 1];
            out += ' || ' + (it.usePattern($pProperty)) + '.test(' + ($key) + ') ';
          }
        }
      }
      out += ' ); if (isAdditional' + ($lvl) + ') { ';
    }
    if ($removeAdditional == 'all') {
      out += ' delete ' + ($data) + '[' + ($key) + ']; ';
    } else {
      var $currentErrorPath = it.errorPath;
      var $additionalProperty = '\' + ' + $key + ' + \'';
      if (it.opts._errorDataPathProperty) {
        it.errorPath = it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
      }
      if ($noAdditional) {
        if ($removeAdditional) {
          out += ' delete ' + ($data) + '[' + ($key) + ']; ';
        } else {
          out += ' ' + ($nextValid) + ' = false; ';
          var $currErrSchemaPath = $errSchemaPath;
          $errSchemaPath = it.errSchemaPath + '/additionalProperties';
          var $$outStack = $$outStack || [];
          $$outStack.push(out);
          out = ''; /* istanbul ignore else */
          if (it.createErrors !== false) {
            out += ' { keyword: \'' + ('additionalProperties') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { additionalProperty: \'' + ($additionalProperty) + '\' } ';
            if (it.opts.messages !== false) {
              out += ' , message: \'';
              if (it.opts._errorDataPathProperty) {
                out += 'is an invalid additional property';
              } else {
                out += 'should NOT have additional properties';
              }
              out += '\' ';
            }
            if (it.opts.verbose) {
              out += ' , schema: false , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
            }
            out += ' } ';
          } else {
            out += ' {} ';
          }
          var __err = out;
          out = $$outStack.pop();
          if (!it.compositeRule && $breakOnError) {
            /* istanbul ignore if */
            if (it.async) {
              out += ' throw new ValidationError([' + (__err) + ']); ';
            } else {
              out += ' validate.errors = [' + (__err) + ']; return false; ';
            }
          } else {
            out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
          }
          $errSchemaPath = $currErrSchemaPath;
          if ($breakOnError) {
            out += ' break; ';
          }
        }
      } else if ($additionalIsSchema) {
        if ($removeAdditional == 'failing') {
          out += ' var ' + ($errs) + ' = errors;  ';
          var $wasComposite = it.compositeRule;
          it.compositeRule = $it.compositeRule = true;
          $it.schema = $aProperties;
          $it.schemaPath = it.schemaPath + '.additionalProperties';
          $it.errSchemaPath = it.errSchemaPath + '/additionalProperties';
          $it.errorPath = it.opts._errorDataPathProperty ? it.errorPath : it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
          var $passData = $data + '[' + $key + ']';
          $it.dataPathArr[$dataNxt] = $key;
          var $code = it.validate($it);
          $it.baseId = $currentBaseId;
          if (it.util.varOccurences($code, $nextData) < 2) {
            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
          } else {
            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
          }
          out += ' if (!' + ($nextValid) + ') { errors = ' + ($errs) + '; if (validate.errors !== null) { if (errors) validate.errors.length = errors; else validate.errors = null; } delete ' + ($data) + '[' + ($key) + ']; }  ';
          it.compositeRule = $it.compositeRule = $wasComposite;
        } else {
          $it.schema = $aProperties;
          $it.schemaPath = it.schemaPath + '.additionalProperties';
          $it.errSchemaPath = it.errSchemaPath + '/additionalProperties';
          $it.errorPath = it.opts._errorDataPathProperty ? it.errorPath : it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
          var $passData = $data + '[' + $key + ']';
          $it.dataPathArr[$dataNxt] = $key;
          var $code = it.validate($it);
          $it.baseId = $currentBaseId;
          if (it.util.varOccurences($code, $nextData) < 2) {
            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
          } else {
            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
          }
          if ($breakOnError) {
            out += ' if (!' + ($nextValid) + ') break; ';
          }
        }
      }
      it.errorPath = $currentErrorPath;
    }
    if ($someProperties) {
      out += ' } ';
    }
    out += ' }  ';
    if ($breakOnError) {
      out += ' if (' + ($nextValid) + ') { ';
      $closingBraces += '}';
    }
  }
  var $useDefaults = it.opts.useDefaults && !it.compositeRule;
  if ($schemaKeys.length) {
    var arr3 = $schemaKeys;
    if (arr3) {
      var $propertyKey, i3 = -1,
        l3 = arr3.length - 1;
      while (i3 < l3) {
        $propertyKey = arr3[i3 += 1];
        var $sch = $schema[$propertyKey];
        if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
          var $prop = it.util.getProperty($propertyKey),
            $passData = $data + $prop,
            $hasDefault = $useDefaults && $sch.default !== undefined;
          $it.schema = $sch;
          $it.schemaPath = $schemaPath + $prop;
          $it.errSchemaPath = $errSchemaPath + '/' + it.util.escapeFragment($propertyKey);
          $it.errorPath = it.util.getPath(it.errorPath, $propertyKey, it.opts.jsonPointers);
          $it.dataPathArr[$dataNxt] = it.util.toQuotedString($propertyKey);
          var $code = it.validate($it);
          $it.baseId = $currentBaseId;
          if (it.util.varOccurences($code, $nextData) < 2) {
            $code = it.util.varReplace($code, $nextData, $passData);
            var $useData = $passData;
          } else {
            var $useData = $nextData;
            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ';
          }
          if ($hasDefault) {
            out += ' ' + ($code) + ' ';
          } else {
            if ($requiredHash && $requiredHash[$propertyKey]) {
              out += ' if ( ' + ($useData) + ' === undefined ';
              if ($ownProperties) {
                out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
              }
              out += ') { ' + ($nextValid) + ' = false; ';
              var $currentErrorPath = it.errorPath,
                $currErrSchemaPath = $errSchemaPath,
                $missingProperty = it.util.escapeQuotes($propertyKey);
              if (it.opts._errorDataPathProperty) {
                it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
              }
              $errSchemaPath = it.errSchemaPath + '/required';
              var $$outStack = $$outStack || [];
              $$outStack.push(out);
              out = ''; /* istanbul ignore else */
              if (it.createErrors !== false) {
                out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
                if (it.opts.messages !== false) {
                  out += ' , message: \'';
                  if (it.opts._errorDataPathProperty) {
                    out += 'is a required property';
                  } else {
                    out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
                  }
                  out += '\' ';
                }
                if (it.opts.verbose) {
                  out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
                }
                out += ' } ';
              } else {
                out += ' {} ';
              }
              var __err = out;
              out = $$outStack.pop();
              if (!it.compositeRule && $breakOnError) {
                /* istanbul ignore if */
                if (it.async) {
                  out += ' throw new ValidationError([' + (__err) + ']); ';
                } else {
                  out += ' validate.errors = [' + (__err) + ']; return false; ';
                }
              } else {
                out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
              }
              $errSchemaPath = $currErrSchemaPath;
              it.errorPath = $currentErrorPath;
              out += ' } else { ';
            } else {
              if ($breakOnError) {
                out += ' if ( ' + ($useData) + ' === undefined ';
                if ($ownProperties) {
                  out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
                }
                out += ') { ' + ($nextValid) + ' = true; } else { ';
              } else {
                out += ' if (' + ($useData) + ' !== undefined ';
                if ($ownProperties) {
                  out += ' &&   Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
                }
                out += ' ) { ';
              }
            }
            out += ' ' + ($code) + ' } ';
          }
        }
        if ($breakOnError) {
          out += ' if (' + ($nextValid) + ') { ';
          $closingBraces += '}';
        }
      }
    }
  }
  if ($pPropertyKeys.length) {
    var arr4 = $pPropertyKeys;
    if (arr4) {
      var $pProperty, i4 = -1,
        l4 = arr4.length - 1;
      while (i4 < l4) {
        $pProperty = arr4[i4 += 1];
        var $sch = $pProperties[$pProperty];
        if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
          $it.schema = $sch;
          $it.schemaPath = it.schemaPath + '.patternProperties' + it.util.getProperty($pProperty);
          $it.errSchemaPath = it.errSchemaPath + '/patternProperties/' + it.util.escapeFragment($pProperty);
          if ($ownProperties) {
            out += ' ' + ($dataProperties) + ' = ' + ($dataProperties) + ' || Object.keys(' + ($data) + '); for (var ' + ($idx) + '=0; ' + ($idx) + '<' + ($dataProperties) + '.length; ' + ($idx) + '++) { var ' + ($key) + ' = ' + ($dataProperties) + '[' + ($idx) + ']; ';
          } else {
            out += ' for (var ' + ($key) + ' in ' + ($data) + ') { ';
          }
          out += ' if (' + (it.usePattern($pProperty)) + '.test(' + ($key) + ')) { ';
          $it.errorPath = it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
          var $passData = $data + '[' + $key + ']';
          $it.dataPathArr[$dataNxt] = $key;
          var $code = it.validate($it);
          $it.baseId = $currentBaseId;
          if (it.util.varOccurences($code, $nextData) < 2) {
            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
          } else {
            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
          }
          if ($breakOnError) {
            out += ' if (!' + ($nextValid) + ') break; ';
          }
          out += ' } ';
          if ($breakOnError) {
            out += ' else ' + ($nextValid) + ' = true; ';
          }
          out += ' }  ';
          if ($breakOnError) {
            out += ' if (' + ($nextValid) + ') { ';
            $closingBraces += '}';
          }
        }
      }
    }
  }
  if ($breakOnError) {
    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  return out;
}


/***/ }),

/***/ 9195:
/***/ ((module) => {

"use strict";

module.exports = function generate_propertyNames(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  out += 'var ' + ($errs) + ' = errors;';
  if ((it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all))) {
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    $it.errSchemaPath = $errSchemaPath;
    var $key = 'key' + $lvl,
      $idx = 'idx' + $lvl,
      $i = 'i' + $lvl,
      $invalidName = '\' + ' + $key + ' + \'',
      $dataNxt = $it.dataLevel = it.dataLevel + 1,
      $nextData = 'data' + $dataNxt,
      $dataProperties = 'dataProperties' + $lvl,
      $ownProperties = it.opts.ownProperties,
      $currentBaseId = it.baseId;
    if ($ownProperties) {
      out += ' var ' + ($dataProperties) + ' = undefined; ';
    }
    if ($ownProperties) {
      out += ' ' + ($dataProperties) + ' = ' + ($dataProperties) + ' || Object.keys(' + ($data) + '); for (var ' + ($idx) + '=0; ' + ($idx) + '<' + ($dataProperties) + '.length; ' + ($idx) + '++) { var ' + ($key) + ' = ' + ($dataProperties) + '[' + ($idx) + ']; ';
    } else {
      out += ' for (var ' + ($key) + ' in ' + ($data) + ') { ';
    }
    out += ' var startErrs' + ($lvl) + ' = errors; ';
    var $passData = $key;
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    var $code = it.validate($it);
    $it.baseId = $currentBaseId;
    if (it.util.varOccurences($code, $nextData) < 2) {
      out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
    } else {
      out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
    }
    it.compositeRule = $it.compositeRule = $wasComposite;
    out += ' if (!' + ($nextValid) + ') { for (var ' + ($i) + '=startErrs' + ($lvl) + '; ' + ($i) + '<errors; ' + ($i) + '++) { vErrors[' + ($i) + '].propertyName = ' + ($key) + '; }   var err =   '; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('propertyNames') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { propertyName: \'' + ($invalidName) + '\' } ';
      if (it.opts.messages !== false) {
        out += ' , message: \'property name \\\'' + ($invalidName) + '\\\' is invalid\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError(vErrors); ';
      } else {
        out += ' validate.errors = vErrors; return false; ';
      }
    }
    if ($breakOnError) {
      out += ' break; ';
    }
    out += ' } }';
  }
  if ($breakOnError) {
    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  return out;
}


/***/ }),

/***/ 2393:
/***/ ((module) => {

"use strict";

module.exports = function generate_ref(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $async, $refCode;
  if ($schema == '#' || $schema == '#/') {
    if (it.isRoot) {
      $async = it.async;
      $refCode = 'validate';
    } else {
      $async = it.root.schema.$async === true;
      $refCode = 'root.refVal[0]';
    }
  } else {
    var $refVal = it.resolveRef(it.baseId, $schema, it.isRoot);
    if ($refVal === undefined) {
      var $message = it.MissingRefError.message(it.baseId, $schema);
      if (it.opts.missingRefs == 'fail') {
        it.logger.error($message);
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ('$ref') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { ref: \'' + (it.util.escapeQuotes($schema)) + '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'can\\\'t resolve reference ' + (it.util.escapeQuotes($schema)) + '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: ' + (it.util.toQuotedString($schema)) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        if ($breakOnError) {
          out += ' if (false) { ';
        }
      } else if (it.opts.missingRefs == 'ignore') {
        it.logger.warn($message);
        if ($breakOnError) {
          out += ' if (true) { ';
        }
      } else {
        throw new it.MissingRefError(it.baseId, $schema, $message);
      }
    } else if ($refVal.inline) {
      var $it = it.util.copy(it);
      $it.level++;
      var $nextValid = 'valid' + $it.level;
      $it.schema = $refVal.schema;
      $it.schemaPath = '';
      $it.errSchemaPath = $schema;
      var $code = it.validate($it).replace(/validate\.schema/g, $refVal.code);
      out += ' ' + ($code) + ' ';
      if ($breakOnError) {
        out += ' if (' + ($nextValid) + ') { ';
      }
    } else {
      $async = $refVal.$async === true || (it.async && $refVal.$async !== false);
      $refCode = $refVal.code;
    }
  }
  if ($refCode) {
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = '';
    if (it.opts.passContext) {
      out += ' ' + ($refCode) + '.call(this, ';
    } else {
      out += ' ' + ($refCode) + '( ';
    }
    out += ' ' + ($data) + ', (dataPath || \'\')';
    if (it.errorPath != '""') {
      out += ' + ' + (it.errorPath);
    }
    var $parentData = $dataLvl ? 'data' + (($dataLvl - 1) || '') : 'parentData',
      $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : 'parentDataProperty';
    out += ' , ' + ($parentData) + ' , ' + ($parentDataProperty) + ', rootData)  ';
    var __callValidate = out;
    out = $$outStack.pop();
    if ($async) {
      if (!it.async) throw new Error('async schema referenced by sync schema');
      if ($breakOnError) {
        out += ' var ' + ($valid) + '; ';
      }
      out += ' try { await ' + (__callValidate) + '; ';
      if ($breakOnError) {
        out += ' ' + ($valid) + ' = true; ';
      }
      out += ' } catch (e) { if (!(e instanceof ValidationError)) throw e; if (vErrors === null) vErrors = e.errors; else vErrors = vErrors.concat(e.errors); errors = vErrors.length; ';
      if ($breakOnError) {
        out += ' ' + ($valid) + ' = false; ';
      }
      out += ' } ';
      if ($breakOnError) {
        out += ' if (' + ($valid) + ') { ';
      }
    } else {
      out += ' if (!' + (__callValidate) + ') { if (vErrors === null) vErrors = ' + ($refCode) + '.errors; else vErrors = vErrors.concat(' + ($refCode) + '.errors); errors = vErrors.length; } ';
      if ($breakOnError) {
        out += ' else { ';
      }
    }
  }
  return out;
}


/***/ }),

/***/ 8420:
/***/ ((module) => {

"use strict";

module.exports = function generate_required(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $vSchema = 'schema' + $lvl;
  if (!$isData) {
    if ($schema.length < it.opts.loopRequired && it.schema.properties && Object.keys(it.schema.properties).length) {
      var $required = [];
      var arr1 = $schema;
      if (arr1) {
        var $property, i1 = -1,
          l1 = arr1.length - 1;
        while (i1 < l1) {
          $property = arr1[i1 += 1];
          var $propertySch = it.schema.properties[$property];
          if (!($propertySch && (it.opts.strictKeywords ? (typeof $propertySch == 'object' && Object.keys($propertySch).length > 0) || $propertySch === false : it.util.schemaHasRules($propertySch, it.RULES.all)))) {
            $required[$required.length] = $property;
          }
        }
      }
    } else {
      var $required = $schema;
    }
  }
  if ($isData || $required.length) {
    var $currentErrorPath = it.errorPath,
      $loopRequired = $isData || $required.length >= it.opts.loopRequired,
      $ownProperties = it.opts.ownProperties;
    if ($breakOnError) {
      out += ' var missing' + ($lvl) + '; ';
      if ($loopRequired) {
        if (!$isData) {
          out += ' var ' + ($vSchema) + ' = validate.schema' + ($schemaPath) + '; ';
        }
        var $i = 'i' + $lvl,
          $propertyPath = 'schema' + $lvl + '[' + $i + ']',
          $missingProperty = '\' + ' + $propertyPath + ' + \'';
        if (it.opts._errorDataPathProperty) {
          it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
        }
        out += ' var ' + ($valid) + ' = true; ';
        if ($isData) {
          out += ' if (schema' + ($lvl) + ' === undefined) ' + ($valid) + ' = true; else if (!Array.isArray(schema' + ($lvl) + ')) ' + ($valid) + ' = false; else {';
        }
        out += ' for (var ' + ($i) + ' = 0; ' + ($i) + ' < ' + ($vSchema) + '.length; ' + ($i) + '++) { ' + ($valid) + ' = ' + ($data) + '[' + ($vSchema) + '[' + ($i) + ']] !== undefined ';
        if ($ownProperties) {
          out += ' &&   Object.prototype.hasOwnProperty.call(' + ($data) + ', ' + ($vSchema) + '[' + ($i) + ']) ';
        }
        out += '; if (!' + ($valid) + ') break; } ';
        if ($isData) {
          out += '  }  ';
        }
        out += '  if (!' + ($valid) + ') {   ';
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'';
            if (it.opts._errorDataPathProperty) {
              out += 'is a required property';
            } else {
              out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
            }
            out += '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        out += ' } else { ';
      } else {
        out += ' if ( ';
        var arr2 = $required;
        if (arr2) {
          var $propertyKey, $i = -1,
            l2 = arr2.length - 1;
          while ($i < l2) {
            $propertyKey = arr2[$i += 1];
            if ($i) {
              out += ' || ';
            }
            var $prop = it.util.getProperty($propertyKey),
              $useData = $data + $prop;
            out += ' ( ( ' + ($useData) + ' === undefined ';
            if ($ownProperties) {
              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
            }
            out += ') && (missing' + ($lvl) + ' = ' + (it.util.toQuotedString(it.opts.jsonPointers ? $propertyKey : $prop)) + ') ) ';
          }
        }
        out += ') {  ';
        var $propertyPath = 'missing' + $lvl,
          $missingProperty = '\' + ' + $propertyPath + ' + \'';
        if (it.opts._errorDataPathProperty) {
          it.errorPath = it.opts.jsonPointers ? it.util.getPathExpr($currentErrorPath, $propertyPath, true) : $currentErrorPath + ' + ' + $propertyPath;
        }
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'';
            if (it.opts._errorDataPathProperty) {
              out += 'is a required property';
            } else {
              out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
            }
            out += '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        out += ' } else { ';
      }
    } else {
      if ($loopRequired) {
        if (!$isData) {
          out += ' var ' + ($vSchema) + ' = validate.schema' + ($schemaPath) + '; ';
        }
        var $i = 'i' + $lvl,
          $propertyPath = 'schema' + $lvl + '[' + $i + ']',
          $missingProperty = '\' + ' + $propertyPath + ' + \'';
        if (it.opts._errorDataPathProperty) {
          it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
        }
        if ($isData) {
          out += ' if (' + ($vSchema) + ' && !Array.isArray(' + ($vSchema) + ')) {  var err =   '; /* istanbul ignore else */
          if (it.createErrors !== false) {
            out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
            if (it.opts.messages !== false) {
              out += ' , message: \'';
              if (it.opts._errorDataPathProperty) {
                out += 'is a required property';
              } else {
                out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
              }
              out += '\' ';
            }
            if (it.opts.verbose) {
              out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
            }
            out += ' } ';
          } else {
            out += ' {} ';
          }
          out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } else if (' + ($vSchema) + ' !== undefined) { ';
        }
        out += ' for (var ' + ($i) + ' = 0; ' + ($i) + ' < ' + ($vSchema) + '.length; ' + ($i) + '++) { if (' + ($data) + '[' + ($vSchema) + '[' + ($i) + ']] === undefined ';
        if ($ownProperties) {
          out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', ' + ($vSchema) + '[' + ($i) + ']) ';
        }
        out += ') {  var err =   '; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'';
            if (it.opts._errorDataPathProperty) {
              out += 'is a required property';
            } else {
              out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
            }
            out += '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } } ';
        if ($isData) {
          out += '  }  ';
        }
      } else {
        var arr3 = $required;
        if (arr3) {
          var $propertyKey, i3 = -1,
            l3 = arr3.length - 1;
          while (i3 < l3) {
            $propertyKey = arr3[i3 += 1];
            var $prop = it.util.getProperty($propertyKey),
              $missingProperty = it.util.escapeQuotes($propertyKey),
              $useData = $data + $prop;
            if (it.opts._errorDataPathProperty) {
              it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
            }
            out += ' if ( ' + ($useData) + ' === undefined ';
            if ($ownProperties) {
              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
            }
            out += ') {  var err =   '; /* istanbul ignore else */
            if (it.createErrors !== false) {
              out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
              if (it.opts.messages !== false) {
                out += ' , message: \'';
                if (it.opts._errorDataPathProperty) {
                  out += 'is a required property';
                } else {
                  out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
                }
                out += '\' ';
              }
              if (it.opts.verbose) {
                out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
              }
              out += ' } ';
            } else {
              out += ' {} ';
            }
            out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ';
          }
        }
      }
    }
    it.errorPath = $currentErrorPath;
  } else if ($breakOnError) {
    out += ' if (true) {';
  }
  return out;
}


/***/ }),

/***/ 4995:
/***/ ((module) => {

"use strict";

module.exports = function generate_uniqueItems(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if (($schema || $isData) && it.opts.uniqueItems !== false) {
    if ($isData) {
      out += ' var ' + ($valid) + '; if (' + ($schemaValue) + ' === false || ' + ($schemaValue) + ' === undefined) ' + ($valid) + ' = true; else if (typeof ' + ($schemaValue) + ' != \'boolean\') ' + ($valid) + ' = false; else { ';
    }
    out += ' var i = ' + ($data) + '.length , ' + ($valid) + ' = true , j; if (i > 1) { ';
    var $itemType = it.schema.items && it.schema.items.type,
      $typeIsArray = Array.isArray($itemType);
    if (!$itemType || $itemType == 'object' || $itemType == 'array' || ($typeIsArray && ($itemType.indexOf('object') >= 0 || $itemType.indexOf('array') >= 0))) {
      out += ' outer: for (;i--;) { for (j = i; j--;) { if (equal(' + ($data) + '[i], ' + ($data) + '[j])) { ' + ($valid) + ' = false; break outer; } } } ';
    } else {
      out += ' var itemIndices = {}, item; for (;i--;) { var item = ' + ($data) + '[i]; ';
      var $method = 'checkDataType' + ($typeIsArray ? 's' : '');
      out += ' if (' + (it.util[$method]($itemType, 'item', it.opts.strictNumbers, true)) + ') continue; ';
      if ($typeIsArray) {
        out += ' if (typeof item == \'string\') item = \'"\' + item; ';
      }
      out += ' if (typeof itemIndices[item] == \'number\') { ' + ($valid) + ' = false; j = itemIndices[item]; break; } itemIndices[item] = i; } ';
    }
    out += ' } ';
    if ($isData) {
      out += '  }  ';
    }
    out += ' if (!' + ($valid) + ') {   ';
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = ''; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('uniqueItems') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { i: i, j: j } ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should NOT have duplicate items (items ## \' + j + \' and \' + i + \' are identical)\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema:  ';
        if ($isData) {
          out += 'validate.schema' + ($schemaPath);
        } else {
          out += '' + ($schema);
        }
        out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    var __err = out;
    out = $$outStack.pop();
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError([' + (__err) + ']); ';
      } else {
        out += ' validate.errors = [' + (__err) + ']; return false; ';
      }
    } else {
      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    out += ' } ';
    if ($breakOnError) {
      out += ' else { ';
    }
  } else {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
  }
  return out;
}


/***/ }),

/***/ 9585:
/***/ ((module) => {

"use strict";

module.exports = function generate_validate(it, $keyword, $ruleType) {
  var out = '';
  var $async = it.schema.$async === true,
    $refKeywords = it.util.schemaHasRulesExcept(it.schema, it.RULES.all, '$ref'),
    $id = it.self._getId(it.schema);
  if (it.opts.strictKeywords) {
    var $unknownKwd = it.util.schemaUnknownRules(it.schema, it.RULES.keywords);
    if ($unknownKwd) {
      var $keywordsMsg = 'unknown keyword: ' + $unknownKwd;
      if (it.opts.strictKeywords === 'log') it.logger.warn($keywordsMsg);
      else throw new Error($keywordsMsg);
    }
  }
  if (it.isTop) {
    out += ' var validate = ';
    if ($async) {
      it.async = true;
      out += 'async ';
    }
    out += 'function(data, dataPath, parentData, parentDataProperty, rootData) { \'use strict\'; ';
    if ($id && (it.opts.sourceCode || it.opts.processCode)) {
      out += ' ' + ('/\*# sourceURL=' + $id + ' */') + ' ';
    }
  }
  if (typeof it.schema == 'boolean' || !($refKeywords || it.schema.$ref)) {
    var $keyword = 'false schema';
    var $lvl = it.level;
    var $dataLvl = it.dataLevel;
    var $schema = it.schema[$keyword];
    var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
    var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
    var $breakOnError = !it.opts.allErrors;
    var $errorKeyword;
    var $data = 'data' + ($dataLvl || '');
    var $valid = 'valid' + $lvl;
    if (it.schema === false) {
      if (it.isTop) {
        $breakOnError = true;
      } else {
        out += ' var ' + ($valid) + ' = false; ';
      }
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = ''; /* istanbul ignore else */
      if (it.createErrors !== false) {
        out += ' { keyword: \'' + ($errorKeyword || 'false schema') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
        if (it.opts.messages !== false) {
          out += ' , message: \'boolean schema is false\' ';
        }
        if (it.opts.verbose) {
          out += ' , schema: false , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
        }
        out += ' } ';
      } else {
        out += ' {} ';
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        /* istanbul ignore if */
        if (it.async) {
          out += ' throw new ValidationError([' + (__err) + ']); ';
        } else {
          out += ' validate.errors = [' + (__err) + ']; return false; ';
        }
      } else {
        out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
      }
    } else {
      if (it.isTop) {
        if ($async) {
          out += ' return data; ';
        } else {
          out += ' validate.errors = null; return true; ';
        }
      } else {
        out += ' var ' + ($valid) + ' = true; ';
      }
    }
    if (it.isTop) {
      out += ' }; return validate; ';
    }
    return out;
  }
  if (it.isTop) {
    var $top = it.isTop,
      $lvl = it.level = 0,
      $dataLvl = it.dataLevel = 0,
      $data = 'data';
    it.rootId = it.resolve.fullPath(it.self._getId(it.root.schema));
    it.baseId = it.baseId || it.rootId;
    delete it.isTop;
    it.dataPathArr = [""];
    if (it.schema.default !== undefined && it.opts.useDefaults && it.opts.strictDefaults) {
      var $defaultMsg = 'default is ignored in the schema root';
      if (it.opts.strictDefaults === 'log') it.logger.warn($defaultMsg);
      else throw new Error($defaultMsg);
    }
    out += ' var vErrors = null; ';
    out += ' var errors = 0;     ';
    out += ' if (rootData === undefined) rootData = data; ';
  } else {
    var $lvl = it.level,
      $dataLvl = it.dataLevel,
      $data = 'data' + ($dataLvl || '');
    if ($id) it.baseId = it.resolve.url(it.baseId, $id);
    if ($async && !it.async) throw new Error('async schema in sync schema');
    out += ' var errs_' + ($lvl) + ' = errors;';
  }
  var $valid = 'valid' + $lvl,
    $breakOnError = !it.opts.allErrors,
    $closingBraces1 = '',
    $closingBraces2 = '';
  var $errorKeyword;
  var $typeSchema = it.schema.type,
    $typeIsArray = Array.isArray($typeSchema);
  if ($typeSchema && it.opts.nullable && it.schema.nullable === true) {
    if ($typeIsArray) {
      if ($typeSchema.indexOf('null') == -1) $typeSchema = $typeSchema.concat('null');
    } else if ($typeSchema != 'null') {
      $typeSchema = [$typeSchema, 'null'];
      $typeIsArray = true;
    }
  }
  if ($typeIsArray && $typeSchema.length == 1) {
    $typeSchema = $typeSchema[0];
    $typeIsArray = false;
  }
  if (it.schema.$ref && $refKeywords) {
    if (it.opts.extendRefs == 'fail') {
      throw new Error('$ref: validation keywords used in schema at path "' + it.errSchemaPath + '" (see option extendRefs)');
    } else if (it.opts.extendRefs !== true) {
      $refKeywords = false;
      it.logger.warn('$ref: keywords ignored in schema at path "' + it.errSchemaPath + '"');
    }
  }
  if (it.schema.$comment && it.opts.$comment) {
    out += ' ' + (it.RULES.all.$comment.code(it, '$comment'));
  }
  if ($typeSchema) {
    if (it.opts.coerceTypes) {
      var $coerceToTypes = it.util.coerceToTypes(it.opts.coerceTypes, $typeSchema);
    }
    var $rulesGroup = it.RULES.types[$typeSchema];
    if ($coerceToTypes || $typeIsArray || $rulesGroup === true || ($rulesGroup && !$shouldUseGroup($rulesGroup))) {
      var $schemaPath = it.schemaPath + '.type',
        $errSchemaPath = it.errSchemaPath + '/type';
      var $schemaPath = it.schemaPath + '.type',
        $errSchemaPath = it.errSchemaPath + '/type',
        $method = $typeIsArray ? 'checkDataTypes' : 'checkDataType';
      out += ' if (' + (it.util[$method]($typeSchema, $data, it.opts.strictNumbers, true)) + ') { ';
      if ($coerceToTypes) {
        var $dataType = 'dataType' + $lvl,
          $coerced = 'coerced' + $lvl;
        out += ' var ' + ($dataType) + ' = typeof ' + ($data) + '; var ' + ($coerced) + ' = undefined; ';
        if (it.opts.coerceTypes == 'array') {
          out += ' if (' + ($dataType) + ' == \'object\' && Array.isArray(' + ($data) + ') && ' + ($data) + '.length == 1) { ' + ($data) + ' = ' + ($data) + '[0]; ' + ($dataType) + ' = typeof ' + ($data) + '; if (' + (it.util.checkDataType(it.schema.type, $data, it.opts.strictNumbers)) + ') ' + ($coerced) + ' = ' + ($data) + '; } ';
        }
        out += ' if (' + ($coerced) + ' !== undefined) ; ';
        var arr1 = $coerceToTypes;
        if (arr1) {
          var $type, $i = -1,
            l1 = arr1.length - 1;
          while ($i < l1) {
            $type = arr1[$i += 1];
            if ($type == 'string') {
              out += ' else if (' + ($dataType) + ' == \'number\' || ' + ($dataType) + ' == \'boolean\') ' + ($coerced) + ' = \'\' + ' + ($data) + '; else if (' + ($data) + ' === null) ' + ($coerced) + ' = \'\'; ';
            } else if ($type == 'number' || $type == 'integer') {
              out += ' else if (' + ($dataType) + ' == \'boolean\' || ' + ($data) + ' === null || (' + ($dataType) + ' == \'string\' && ' + ($data) + ' && ' + ($data) + ' == +' + ($data) + ' ';
              if ($type == 'integer') {
                out += ' && !(' + ($data) + ' % 1)';
              }
              out += ')) ' + ($coerced) + ' = +' + ($data) + '; ';
            } else if ($type == 'boolean') {
              out += ' else if (' + ($data) + ' === \'false\' || ' + ($data) + ' === 0 || ' + ($data) + ' === null) ' + ($coerced) + ' = false; else if (' + ($data) + ' === \'true\' || ' + ($data) + ' === 1) ' + ($coerced) + ' = true; ';
            } else if ($type == 'null') {
              out += ' else if (' + ($data) + ' === \'\' || ' + ($data) + ' === 0 || ' + ($data) + ' === false) ' + ($coerced) + ' = null; ';
            } else if (it.opts.coerceTypes == 'array' && $type == 'array') {
              out += ' else if (' + ($dataType) + ' == \'string\' || ' + ($dataType) + ' == \'number\' || ' + ($dataType) + ' == \'boolean\' || ' + ($data) + ' == null) ' + ($coerced) + ' = [' + ($data) + ']; ';
            }
          }
        }
        out += ' else {   ';
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ($errorKeyword || 'type') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { type: \'';
          if ($typeIsArray) {
            out += '' + ($typeSchema.join(","));
          } else {
            out += '' + ($typeSchema);
          }
          out += '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'should be ';
            if ($typeIsArray) {
              out += '' + ($typeSchema.join(","));
            } else {
              out += '' + ($typeSchema);
            }
            out += '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        out += ' } if (' + ($coerced) + ' !== undefined) {  ';
        var $parentData = $dataLvl ? 'data' + (($dataLvl - 1) || '') : 'parentData',
          $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : 'parentDataProperty';
        out += ' ' + ($data) + ' = ' + ($coerced) + '; ';
        if (!$dataLvl) {
          out += 'if (' + ($parentData) + ' !== undefined)';
        }
        out += ' ' + ($parentData) + '[' + ($parentDataProperty) + '] = ' + ($coerced) + '; } ';
      } else {
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ($errorKeyword || 'type') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { type: \'';
          if ($typeIsArray) {
            out += '' + ($typeSchema.join(","));
          } else {
            out += '' + ($typeSchema);
          }
          out += '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'should be ';
            if ($typeIsArray) {
              out += '' + ($typeSchema.join(","));
            } else {
              out += '' + ($typeSchema);
            }
            out += '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
      }
      out += ' } ';
    }
  }
  if (it.schema.$ref && !$refKeywords) {
    out += ' ' + (it.RULES.all.$ref.code(it, '$ref')) + ' ';
    if ($breakOnError) {
      out += ' } if (errors === ';
      if ($top) {
        out += '0';
      } else {
        out += 'errs_' + ($lvl);
      }
      out += ') { ';
      $closingBraces2 += '}';
    }
  } else {
    var arr2 = it.RULES;
    if (arr2) {
      var $rulesGroup, i2 = -1,
        l2 = arr2.length - 1;
      while (i2 < l2) {
        $rulesGroup = arr2[i2 += 1];
        if ($shouldUseGroup($rulesGroup)) {
          if ($rulesGroup.type) {
            out += ' if (' + (it.util.checkDataType($rulesGroup.type, $data, it.opts.strictNumbers)) + ') { ';
          }
          if (it.opts.useDefaults) {
            if ($rulesGroup.type == 'object' && it.schema.properties) {
              var $schema = it.schema.properties,
                $schemaKeys = Object.keys($schema);
              var arr3 = $schemaKeys;
              if (arr3) {
                var $propertyKey, i3 = -1,
                  l3 = arr3.length - 1;
                while (i3 < l3) {
                  $propertyKey = arr3[i3 += 1];
                  var $sch = $schema[$propertyKey];
                  if ($sch.default !== undefined) {
                    var $passData = $data + it.util.getProperty($propertyKey);
                    if (it.compositeRule) {
                      if (it.opts.strictDefaults) {
                        var $defaultMsg = 'default is ignored for: ' + $passData;
                        if (it.opts.strictDefaults === 'log') it.logger.warn($defaultMsg);
                        else throw new Error($defaultMsg);
                      }
                    } else {
                      out += ' if (' + ($passData) + ' === undefined ';
                      if (it.opts.useDefaults == 'empty') {
                        out += ' || ' + ($passData) + ' === null || ' + ($passData) + ' === \'\' ';
                      }
                      out += ' ) ' + ($passData) + ' = ';
                      if (it.opts.useDefaults == 'shared') {
                        out += ' ' + (it.useDefault($sch.default)) + ' ';
                      } else {
                        out += ' ' + (JSON.stringify($sch.default)) + ' ';
                      }
                      out += '; ';
                    }
                  }
                }
              }
            } else if ($rulesGroup.type == 'array' && Array.isArray(it.schema.items)) {
              var arr4 = it.schema.items;
              if (arr4) {
                var $sch, $i = -1,
                  l4 = arr4.length - 1;
                while ($i < l4) {
                  $sch = arr4[$i += 1];
                  if ($sch.default !== undefined) {
                    var $passData = $data + '[' + $i + ']';
                    if (it.compositeRule) {
                      if (it.opts.strictDefaults) {
                        var $defaultMsg = 'default is ignored for: ' + $passData;
                        if (it.opts.strictDefaults === 'log') it.logger.warn($defaultMsg);
                        else throw new Error($defaultMsg);
                      }
                    } else {
                      out += ' if (' + ($passData) + ' === undefined ';
                      if (it.opts.useDefaults == 'empty') {
                        out += ' || ' + ($passData) + ' === null || ' + ($passData) + ' === \'\' ';
                      }
                      out += ' ) ' + ($passData) + ' = ';
                      if (it.opts.useDefaults == 'shared') {
                        out += ' ' + (it.useDefault($sch.default)) + ' ';
                      } else {
                        out += ' ' + (JSON.stringify($sch.default)) + ' ';
                      }
                      out += '; ';
                    }
                  }
                }
              }
            }
          }
          var arr5 = $rulesGroup.rules;
          if (arr5) {
            var $rule, i5 = -1,
              l5 = arr5.length - 1;
            while (i5 < l5) {
              $rule = arr5[i5 += 1];
              if ($shouldUseRule($rule)) {
                var $code = $rule.code(it, $rule.keyword, $rulesGroup.type);
                if ($code) {
                  out += ' ' + ($code) + ' ';
                  if ($breakOnError) {
                    $closingBraces1 += '}';
                  }
                }
              }
            }
          }
          if ($breakOnError) {
            out += ' ' + ($closingBraces1) + ' ';
            $closingBraces1 = '';
          }
          if ($rulesGroup.type) {
            out += ' } ';
            if ($typeSchema && $typeSchema === $rulesGroup.type && !$coerceToTypes) {
              out += ' else { ';
              var $schemaPath = it.schemaPath + '.type',
                $errSchemaPath = it.errSchemaPath + '/type';
              var $$outStack = $$outStack || [];
              $$outStack.push(out);
              out = ''; /* istanbul ignore else */
              if (it.createErrors !== false) {
                out += ' { keyword: \'' + ($errorKeyword || 'type') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { type: \'';
                if ($typeIsArray) {
                  out += '' + ($typeSchema.join(","));
                } else {
                  out += '' + ($typeSchema);
                }
                out += '\' } ';
                if (it.opts.messages !== false) {
                  out += ' , message: \'should be ';
                  if ($typeIsArray) {
                    out += '' + ($typeSchema.join(","));
                  } else {
                    out += '' + ($typeSchema);
                  }
                  out += '\' ';
                }
                if (it.opts.verbose) {
                  out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
                }
                out += ' } ';
              } else {
                out += ' {} ';
              }
              var __err = out;
              out = $$outStack.pop();
              if (!it.compositeRule && $breakOnError) {
                /* istanbul ignore if */
                if (it.async) {
                  out += ' throw new ValidationError([' + (__err) + ']); ';
                } else {
                  out += ' validate.errors = [' + (__err) + ']; return false; ';
                }
              } else {
                out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
              }
              out += ' } ';
            }
          }
          if ($breakOnError) {
            out += ' if (errors === ';
            if ($top) {
              out += '0';
            } else {
              out += 'errs_' + ($lvl);
            }
            out += ') { ';
            $closingBraces2 += '}';
          }
        }
      }
    }
  }
  if ($breakOnError) {
    out += ' ' + ($closingBraces2) + ' ';
  }
  if ($top) {
    if ($async) {
      out += ' if (errors === 0) return data;           ';
      out += ' else throw new ValidationError(vErrors); ';
    } else {
      out += ' validate.errors = vErrors; ';
      out += ' return errors === 0;       ';
    }
    out += ' }; return validate;';
  } else {
    out += ' var ' + ($valid) + ' = errors === errs_' + ($lvl) + ';';
  }

  function $shouldUseGroup($rulesGroup) {
    var rules = $rulesGroup.rules;
    for (var i = 0; i < rules.length; i++)
      if ($shouldUseRule(rules[i])) return true;
  }

  function $shouldUseRule($rule) {
    return it.schema[$rule.keyword] !== undefined || ($rule.implements && $ruleImplementsSomeKeyword($rule));
  }

  function $ruleImplementsSomeKeyword($rule) {
    var impl = $rule.implements;
    for (var i = 0; i < impl.length; i++)
      if (it.schema[impl[i]] !== undefined) return true;
  }
  return out;
}


/***/ }),

/***/ 3297:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var IDENTIFIER = /^[a-z_$][a-z0-9_$-]*$/i;
var customRuleCode = __webpack_require__(5912);
var definitionSchema = __webpack_require__(458);

module.exports = {
  add: addKeyword,
  get: getKeyword,
  remove: removeKeyword,
  validate: validateKeyword
};


/**
 * Define custom keyword
 * @this  Ajv
 * @param {String} keyword custom keyword, should be unique (including different from all standard, custom and macro keywords).
 * @param {Object} definition keyword definition object with properties `type` (type(s) which the keyword applies to), `validate` or `compile`.
 * @return {Ajv} this for method chaining
 */
function addKeyword(keyword, definition) {
  /* jshint validthis: true */
  /* eslint no-shadow: 0 */
  var RULES = this.RULES;
  if (RULES.keywords[keyword])
    throw new Error('Keyword ' + keyword + ' is already defined');

  if (!IDENTIFIER.test(keyword))
    throw new Error('Keyword ' + keyword + ' is not a valid identifier');

  if (definition) {
    this.validateKeyword(definition, true);

    var dataType = definition.type;
    if (Array.isArray(dataType)) {
      for (var i=0; i<dataType.length; i++)
        _addRule(keyword, dataType[i], definition);
    } else {
      _addRule(keyword, dataType, definition);
    }

    var metaSchema = definition.metaSchema;
    if (metaSchema) {
      if (definition.$data && this._opts.$data) {
        metaSchema = {
          anyOf: [
            metaSchema,
            { '$ref': 'https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#' }
          ]
        };
      }
      definition.validateSchema = this.compile(metaSchema, true);
    }
  }

  RULES.keywords[keyword] = RULES.all[keyword] = true;


  function _addRule(keyword, dataType, definition) {
    var ruleGroup;
    for (var i=0; i<RULES.length; i++) {
      var rg = RULES[i];
      if (rg.type == dataType) {
        ruleGroup = rg;
        break;
      }
    }

    if (!ruleGroup) {
      ruleGroup = { type: dataType, rules: [] };
      RULES.push(ruleGroup);
    }

    var rule = {
      keyword: keyword,
      definition: definition,
      custom: true,
      code: customRuleCode,
      implements: definition.implements
    };
    ruleGroup.rules.push(rule);
    RULES.custom[keyword] = rule;
  }

  return this;
}


/**
 * Get keyword
 * @this  Ajv
 * @param {String} keyword pre-defined or custom keyword.
 * @return {Object|Boolean} custom keyword definition, `true` if it is a predefined keyword, `false` otherwise.
 */
function getKeyword(keyword) {
  /* jshint validthis: true */
  var rule = this.RULES.custom[keyword];
  return rule ? rule.definition : this.RULES.keywords[keyword] || false;
}


/**
 * Remove keyword
 * @this  Ajv
 * @param {String} keyword pre-defined or custom keyword.
 * @return {Ajv} this for method chaining
 */
function removeKeyword(keyword) {
  /* jshint validthis: true */
  var RULES = this.RULES;
  delete RULES.keywords[keyword];
  delete RULES.all[keyword];
  delete RULES.custom[keyword];
  for (var i=0; i<RULES.length; i++) {
    var rules = RULES[i].rules;
    for (var j=0; j<rules.length; j++) {
      if (rules[j].keyword == keyword) {
        rules.splice(j, 1);
        break;
      }
    }
  }
  return this;
}


/**
 * Validate keyword definition
 * @this  Ajv
 * @param {Object} definition keyword definition object.
 * @param {Boolean} throwError true to throw exception if definition is invalid
 * @return {boolean} validation result
 */
function validateKeyword(definition, throwError) {
  validateKeyword.errors = null;
  var v = this._validateKeyword = this._validateKeyword
                                  || this.compile(definitionSchema, true);

  if (v(definition)) return true;
  validateKeyword.errors = v.errors;
  if (throwError)
    throw new Error('custom keyword definition is invalid: '  + this.errorsText(v.errors));
  else
    return false;
}


/***/ }),

/***/ 9417:
/***/ ((module) => {

"use strict";

module.exports = balanced;
function balanced(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}


/***/ }),

/***/ 8738:
/***/ (function(module) {

/*
 *  big.js v5.2.2
 *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
 *  Copyright (c) 2018 Michael Mclaughlin <M8ch88l@gmail.com>
 *  https://github.com/MikeMcl/big.js/LICENCE
 */
;(function (GLOBAL) {
  'use strict';
  var Big,


/************************************** EDITABLE DEFAULTS *****************************************/


    // The default values below must be integers within the stated ranges.

    /*
     * The maximum number of decimal places (DP) of the results of operations involving division:
     * div and sqrt, and pow with negative exponents.
     */
    DP = 20,          // 0 to MAX_DP

    /*
     * The rounding mode (RM) used when rounding to the above decimal places.
     *
     *  0  Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
     *  1  To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
     *  2  To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
     *  3  Away from zero.                                  (ROUND_UP)
     */
    RM = 1,             // 0, 1, 2 or 3

    // The maximum value of DP and Big.DP.
    MAX_DP = 1E6,       // 0 to 1000000

    // The maximum magnitude of the exponent argument to the pow method.
    MAX_POWER = 1E6,    // 1 to 1000000

    /*
     * The negative exponent (NE) at and beneath which toString returns exponential notation.
     * (JavaScript numbers: -7)
     * -1000000 is the minimum recommended exponent value of a Big.
     */
    NE = -7,            // 0 to -1000000

    /*
     * The positive exponent (PE) at and above which toString returns exponential notation.
     * (JavaScript numbers: 21)
     * 1000000 is the maximum recommended exponent value of a Big.
     * (This limit is not enforced or checked.)
     */
    PE = 21,            // 0 to 1000000


/**************************************************************************************************/


    // Error messages.
    NAME = '[big.js] ',
    INVALID = NAME + 'Invalid ',
    INVALID_DP = INVALID + 'decimal places',
    INVALID_RM = INVALID + 'rounding mode',
    DIV_BY_ZERO = NAME + 'Division by zero',

    // The shared prototype object.
    P = {},
    UNDEFINED = void 0,
    NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;


  /*
   * Create and return a Big constructor.
   *
   */
  function _Big_() {

    /*
     * The Big constructor and exported function.
     * Create and return a new instance of a Big number object.
     *
     * n {number|string|Big} A numeric value.
     */
    function Big(n) {
      var x = this;

      // Enable constructor usage without new.
      if (!(x instanceof Big)) return n === UNDEFINED ? _Big_() : new Big(n);

      // Duplicate.
      if (n instanceof Big) {
        x.s = n.s;
        x.e = n.e;
        x.c = n.c.slice();
      } else {
        parse(x, n);
      }

      /*
       * Retain a reference to this Big constructor, and shadow Big.prototype.constructor which
       * points to Object.
       */
      x.constructor = Big;
    }

    Big.prototype = P;
    Big.DP = DP;
    Big.RM = RM;
    Big.NE = NE;
    Big.PE = PE;
    Big.version = '5.2.2';

    return Big;
  }


  /*
   * Parse the number or string value passed to a Big constructor.
   *
   * x {Big} A Big number instance.
   * n {number|string} A numeric value.
   */
  function parse(x, n) {
    var e, i, nl;

    // Minus zero?
    if (n === 0 && 1 / n < 0) n = '-0';
    else if (!NUMERIC.test(n += '')) throw Error(INVALID + 'number');

    // Determine sign.
    x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

    // Decimal point?
    if ((e = n.indexOf('.')) > -1) n = n.replace('.', '');

    // Exponential form?
    if ((i = n.search(/e/i)) > 0) {

      // Determine exponent.
      if (e < 0) e = i;
      e += +n.slice(i + 1);
      n = n.substring(0, i);
    } else if (e < 0) {

      // Integer.
      e = n.length;
    }

    nl = n.length;

    // Determine leading zeros.
    for (i = 0; i < nl && n.charAt(i) == '0';) ++i;

    if (i == nl) {

      // Zero.
      x.c = [x.e = 0];
    } else {

      // Determine trailing zeros.
      for (; nl > 0 && n.charAt(--nl) == '0';);
      x.e = e - i - 1;
      x.c = [];

      // Convert string to array of digits without leading/trailing zeros.
      for (e = 0; i <= nl;) x.c[e++] = +n.charAt(i++);
    }

    return x;
  }


  /*
   * Round Big x to a maximum of dp decimal places using rounding mode rm.
   * Called by stringify, P.div, P.round and P.sqrt.
   *
   * x {Big} The Big to round.
   * dp {number} Integer, 0 to MAX_DP inclusive.
   * rm {number} 0, 1, 2 or 3 (DOWN, HALF_UP, HALF_EVEN, UP)
   * [more] {boolean} Whether the result of division was truncated.
   */
  function round(x, dp, rm, more) {
    var xc = x.c,
      i = x.e + dp + 1;

    if (i < xc.length) {
      if (rm === 1) {

        // xc[i] is the digit after the digit that may be rounded up.
        more = xc[i] >= 5;
      } else if (rm === 2) {
        more = xc[i] > 5 || xc[i] == 5 &&
          (more || i < 0 || xc[i + 1] !== UNDEFINED || xc[i - 1] & 1);
      } else if (rm === 3) {
        more = more || !!xc[0];
      } else {
        more = false;
        if (rm !== 0) throw Error(INVALID_RM);
      }

      if (i < 1) {
        xc.length = 1;

        if (more) {

          // 1, 0.1, 0.01, 0.001, 0.0001 etc.
          x.e = -dp;
          xc[0] = 1;
        } else {

          // Zero.
          xc[0] = x.e = 0;
        }
      } else {

        // Remove any digits after the required decimal places.
        xc.length = i--;

        // Round up?
        if (more) {

          // Rounding up may mean the previous digit has to be rounded up.
          for (; ++xc[i] > 9;) {
            xc[i] = 0;
            if (!i--) {
              ++x.e;
              xc.unshift(1);
            }
          }
        }

        // Remove trailing zeros.
        for (i = xc.length; !xc[--i];) xc.pop();
      }
    } else if (rm < 0 || rm > 3 || rm !== ~~rm) {
      throw Error(INVALID_RM);
    }

    return x;
  }


  /*
   * Return a string representing the value of Big x in normal or exponential notation.
   * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
   *
   * x {Big}
   * id? {number} Caller id.
   *         1 toExponential
   *         2 toFixed
   *         3 toPrecision
   *         4 valueOf
   * n? {number|undefined} Caller's argument.
   * k? {number|undefined}
   */
  function stringify(x, id, n, k) {
    var e, s,
      Big = x.constructor,
      z = !x.c[0];

    if (n !== UNDEFINED) {
      if (n !== ~~n || n < (id == 3) || n > MAX_DP) {
        throw Error(id == 3 ? INVALID + 'precision' : INVALID_DP);
      }

      x = new Big(x);

      // The index of the digit that may be rounded up.
      n = k - x.e;

      // Round?
      if (x.c.length > ++k) round(x, n, Big.RM);

      // toFixed: recalculate k as x.e may have changed if value rounded up.
      if (id == 2) k = x.e + n + 1;

      // Append zeros?
      for (; x.c.length < k;) x.c.push(0);
    }

    e = x.e;
    s = x.c.join('');
    n = s.length;

    // Exponential notation?
    if (id != 2 && (id == 1 || id == 3 && k <= e || e <= Big.NE || e >= Big.PE)) {
      s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

    // Normal notation.
    } else if (e < 0) {
      for (; ++e;) s = '0' + s;
      s = '0.' + s;
    } else if (e > 0) {
      if (++e > n) for (e -= n; e--;) s += '0';
      else if (e < n) s = s.slice(0, e) + '.' + s.slice(e);
    } else if (n > 1) {
      s = s.charAt(0) + '.' + s.slice(1);
    }

    return x.s < 0 && (!z || id == 4) ? '-' + s : s;
  }


  // Prototype/instance methods


  /*
   * Return a new Big whose value is the absolute value of this Big.
   */
  P.abs = function () {
    var x = new this.constructor(this);
    x.s = 1;
    return x;
  };


  /*
   * Return 1 if the value of this Big is greater than the value of Big y,
   *       -1 if the value of this Big is less than the value of Big y, or
   *        0 if they have the same value.
  */
  P.cmp = function (y) {
    var isneg,
      x = this,
      xc = x.c,
      yc = (y = new x.constructor(y)).c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either zero?
    if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    isneg = i < 0;

    // Compare exponents.
    if (k != l) return k > l ^ isneg ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = -1; ++i < j;) {
      if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
    }

    // Compare lengths.
    return k == l ? 0 : k > l ^ isneg ? 1 : -1;
  };


  /*
   * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
   * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
  P.div = function (y) {
    var x = this,
      Big = x.constructor,
      a = x.c,                  // dividend
      b = (y = new Big(y)).c,   // divisor
      k = x.s == y.s ? 1 : -1,
      dp = Big.DP;

    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);

    // Divisor is zero?
    if (!b[0]) throw Error(DIV_BY_ZERO);

    // Dividend is 0? Return +-0.
    if (!a[0]) return new Big(k * 0);

    var bl, bt, n, cmp, ri,
      bz = b.slice(),
      ai = bl = b.length,
      al = a.length,
      r = a.slice(0, bl),   // remainder
      rl = r.length,
      q = y,                // quotient
      qc = q.c = [],
      qi = 0,
      d = dp + (q.e = x.e - y.e) + 1;    // number of digits of the result

    q.s = k;
    k = d < 0 ? 0 : d;

    // Create version of divisor with leading zero.
    bz.unshift(0);

    // Add zeros to make remainder as long as divisor.
    for (; rl++ < bl;) r.push(0);

    do {

      // n is how many times the divisor goes into current remainder.
      for (n = 0; n < 10; n++) {

        // Compare divisor and remainder.
        if (bl != (rl = r.length)) {
          cmp = bl > rl ? 1 : -1;
        } else {
          for (ri = -1, cmp = 0; ++ri < bl;) {
            if (b[ri] != r[ri]) {
              cmp = b[ri] > r[ri] ? 1 : -1;
              break;
            }
          }
        }

        // If divisor < remainder, subtract divisor from remainder.
        if (cmp < 0) {

          // Remainder can't be more than 1 digit longer than divisor.
          // Equalise lengths using divisor with extra leading zero?
          for (bt = rl == bl ? b : bz; rl;) {
            if (r[--rl] < bt[rl]) {
              ri = rl;
              for (; ri && !r[--ri];) r[ri] = 9;
              --r[ri];
              r[rl] += 10;
            }
            r[rl] -= bt[rl];
          }

          for (; !r[0];) r.shift();
        } else {
          break;
        }
      }

      // Add the digit n to the result array.
      qc[qi++] = cmp ? n : ++n;

      // Update the remainder.
      if (r[0] && cmp) r[rl] = a[ai] || 0;
      else r = [a[ai]];

    } while ((ai++ < al || r[0] !== UNDEFINED) && k--);

    // Leading zero? Do not remove if result is simply zero (qi == 1).
    if (!qc[0] && qi != 1) {

      // There can't be more than one zero.
      qc.shift();
      q.e--;
    }

    // Round?
    if (qi > d) round(q, dp, Big.RM, r[0] !== UNDEFINED);

    return q;
  };


  /*
   * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
   */
  P.eq = function (y) {
    return !this.cmp(y);
  };


  /*
   * Return true if the value of this Big is greater than the value of Big y, otherwise return
   * false.
   */
  P.gt = function (y) {
    return this.cmp(y) > 0;
  };


  /*
   * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
   * return false.
   */
  P.gte = function (y) {
    return this.cmp(y) > -1;
  };


  /*
   * Return true if the value of this Big is less than the value of Big y, otherwise return false.
   */
  P.lt = function (y) {
    return this.cmp(y) < 0;
  };


  /*
   * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
   * return false.
   */
  P.lte = function (y) {
    return this.cmp(y) < 1;
  };


  /*
   * Return a new Big whose value is the value of this Big minus the value of Big y.
   */
  P.minus = P.sub = function (y) {
    var i, j, t, xlty,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    // Signs differ?
    if (a != b) {
      y.s = -b;
      return x.plus(y);
    }

    var xc = x.c.slice(),
      xe = x.e,
      yc = y.c,
      ye = y.e;

    // Either zero?
    if (!xc[0] || !yc[0]) {

      // y is non-zero? x is non-zero? Or both are zero.
      return yc[0] ? (y.s = -b, y) : new Big(xc[0] ? x : 0);
    }

    // Determine which is the bigger number. Prepend zeros to equalise exponents.
    if (a = xe - ye) {

      if (xlty = a < 0) {
        a = -a;
        t = xc;
      } else {
        ye = xe;
        t = yc;
      }

      t.reverse();
      for (b = a; b--;) t.push(0);
      t.reverse();
    } else {

      // Exponents equal. Check digit by digit.
      j = ((xlty = xc.length < yc.length) ? xc : yc).length;

      for (a = b = 0; b < j; b++) {
        if (xc[b] != yc[b]) {
          xlty = xc[b] < yc[b];
          break;
        }
      }
    }

    // x < y? Point xc to the array of the bigger number.
    if (xlty) {
      t = xc;
      xc = yc;
      yc = t;
      y.s = -y.s;
    }

    /*
     * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
     * needs to start at yc.length.
     */
    if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;

    // Subtract yc from xc.
    for (b = i; j > a;) {
      if (xc[--j] < yc[j]) {
        for (i = j; i && !xc[--i];) xc[i] = 9;
        --xc[i];
        xc[j] += 10;
      }

      xc[j] -= yc[j];
    }

    // Remove trailing zeros.
    for (; xc[--b] === 0;) xc.pop();

    // Remove leading zeros and adjust exponent accordingly.
    for (; xc[0] === 0;) {
      xc.shift();
      --ye;
    }

    if (!xc[0]) {

      // n - n = +0
      y.s = 1;

      // Result must be zero.
      xc = [ye = 0];
    }

    y.c = xc;
    y.e = ye;

    return y;
  };


  /*
   * Return a new Big whose value is the value of this Big modulo the value of Big y.
   */
  P.mod = function (y) {
    var ygtx,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    if (!y.c[0]) throw Error(DIV_BY_ZERO);

    x.s = y.s = 1;
    ygtx = y.cmp(x) == 1;
    x.s = a;
    y.s = b;

    if (ygtx) return new Big(x);

    a = Big.DP;
    b = Big.RM;
    Big.DP = Big.RM = 0;
    x = x.div(y);
    Big.DP = a;
    Big.RM = b;

    return this.minus(x.times(y));
  };


  /*
   * Return a new Big whose value is the value of this Big plus the value of Big y.
   */
  P.plus = P.add = function (y) {
    var t,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    // Signs differ?
    if (a != b) {
      y.s = -b;
      return x.minus(y);
    }

    var xe = x.e,
      xc = x.c,
      ye = y.e,
      yc = y.c;

    // Either zero? y is non-zero? x is non-zero? Or both are zero.
    if (!xc[0] || !yc[0]) return yc[0] ? y : new Big(xc[0] ? x : a * 0);

    xc = xc.slice();

    // Prepend zeros to equalise exponents.
    // Note: reverse faster than unshifts.
    if (a = xe - ye) {
      if (a > 0) {
        ye = xe;
        t = yc;
      } else {
        a = -a;
        t = xc;
      }

      t.reverse();
      for (; a--;) t.push(0);
      t.reverse();
    }

    // Point xc to the longer array.
    if (xc.length - yc.length < 0) {
      t = yc;
      yc = xc;
      xc = t;
    }

    a = yc.length;

    // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
    for (b = 0; a; xc[a] %= 10) b = (xc[--a] = xc[a] + yc[a] + b) / 10 | 0;

    // No need to check for zero, as +x + +y != 0 && -x + -y != 0

    if (b) {
      xc.unshift(b);
      ++ye;
    }

    // Remove trailing zeros.
    for (a = xc.length; xc[--a] === 0;) xc.pop();

    y.c = xc;
    y.e = ye;

    return y;
  };


  /*
   * Return a Big whose value is the value of this Big raised to the power n.
   * If n is negative, round to a maximum of Big.DP decimal places using rounding
   * mode Big.RM.
   *
   * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
   */
  P.pow = function (n) {
    var x = this,
      one = new x.constructor(1),
      y = one,
      isneg = n < 0;

    if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) throw Error(INVALID + 'exponent');
    if (isneg) n = -n;

    for (;;) {
      if (n & 1) y = y.times(x);
      n >>= 1;
      if (!n) break;
      x = x.times(x);
    }

    return isneg ? one.div(y) : y;
  };


  /*
   * Return a new Big whose value is the value of this Big rounded using rounding mode rm
   * to a maximum of dp decimal places, or, if dp is negative, to an integer which is a
   * multiple of 10**-dp.
   * If dp is not specified, round to 0 decimal places.
   * If rm is not specified, use Big.RM.
   *
   * dp? {number} Integer, -MAX_DP to MAX_DP inclusive.
   * rm? 0, 1, 2 or 3 (ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_UP)
   */
  P.round = function (dp, rm) {
    var Big = this.constructor;
    if (dp === UNDEFINED) dp = 0;
    else if (dp !== ~~dp || dp < -MAX_DP || dp > MAX_DP) throw Error(INVALID_DP);
    return round(new Big(this), dp, rm === UNDEFINED ? Big.RM : rm);
  };


  /*
   * Return a new Big whose value is the square root of the value of this Big, rounded, if
   * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
  P.sqrt = function () {
    var r, c, t,
      x = this,
      Big = x.constructor,
      s = x.s,
      e = x.e,
      half = new Big(0.5);

    // Zero?
    if (!x.c[0]) return new Big(x);

    // Negative?
    if (s < 0) throw Error(NAME + 'No square root');

    // Estimate.
    s = Math.sqrt(x + '');

    // Math.sqrt underflow/overflow?
    // Re-estimate: pass x coefficient to Math.sqrt as integer, then adjust the result exponent.
    if (s === 0 || s === 1 / 0) {
      c = x.c.join('');
      if (!(c.length + e & 1)) c += '0';
      s = Math.sqrt(c);
      e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
      r = new Big((s == 1 / 0 ? '1e' : (s = s.toExponential()).slice(0, s.indexOf('e') + 1)) + e);
    } else {
      r = new Big(s);
    }

    e = r.e + (Big.DP += 4);

    // Newton-Raphson iteration.
    do {
      t = r;
      r = half.times(t.plus(x.div(t)));
    } while (t.c.slice(0, e).join('') !== r.c.slice(0, e).join(''));

    return round(r, Big.DP -= 4, Big.RM);
  };


  /*
   * Return a new Big whose value is the value of this Big times the value of Big y.
   */
  P.times = P.mul = function (y) {
    var c,
      x = this,
      Big = x.constructor,
      xc = x.c,
      yc = (y = new Big(y)).c,
      a = xc.length,
      b = yc.length,
      i = x.e,
      j = y.e;

    // Determine sign of result.
    y.s = x.s == y.s ? 1 : -1;

    // Return signed 0 if either 0.
    if (!xc[0] || !yc[0]) return new Big(y.s * 0);

    // Initialise exponent of result as x.e + y.e.
    y.e = i + j;

    // If array xc has fewer digits than yc, swap xc and yc, and lengths.
    if (a < b) {
      c = xc;
      xc = yc;
      yc = c;
      j = a;
      a = b;
      b = j;
    }

    // Initialise coefficient array of result with zeros.
    for (c = new Array(j = a + b); j--;) c[j] = 0;

    // Multiply.

    // i is initially xc.length.
    for (i = b; i--;) {
      b = 0;

      // a is yc.length.
      for (j = a + i; j > i;) {

        // Current sum of products at this digit position, plus carry.
        b = c[j] + yc[i] * xc[j - i - 1] + b;
        c[j--] = b % 10;

        // carry
        b = b / 10 | 0;
      }

      c[j] = (c[j] + b) % 10;
    }

    // Increment result exponent if there is a final carry, otherwise remove leading zero.
    if (b) ++y.e;
    else c.shift();

    // Remove trailing zeros.
    for (i = c.length; !c[--i];) c.pop();
    y.c = c;

    return y;
  };


  /*
   * Return a string representing the value of this Big in exponential notation to dp fixed decimal
   * places and rounded using Big.RM.
   *
   * dp? {number} Integer, 0 to MAX_DP inclusive.
   */
  P.toExponential = function (dp) {
    return stringify(this, 1, dp, dp);
  };


  /*
   * Return a string representing the value of this Big in normal notation to dp fixed decimal
   * places and rounded using Big.RM.
   *
   * dp? {number} Integer, 0 to MAX_DP inclusive.
   *
   * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
   * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
   */
  P.toFixed = function (dp) {
    return stringify(this, 2, dp, this.e + dp);
  };


  /*
   * Return a string representing the value of this Big rounded to sd significant digits using
   * Big.RM. Use exponential notation if sd is less than the number of digits necessary to represent
   * the integer part of the value in normal notation.
   *
   * sd {number} Integer, 1 to MAX_DP inclusive.
   */
  P.toPrecision = function (sd) {
    return stringify(this, 3, sd, sd - 1);
  };


  /*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Omit the sign for negative zero.
   */
  P.toString = function () {
    return stringify(this);
  };


  /*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Include the sign for negative zero.
   */
  P.valueOf = P.toJSON = function () {
    return stringify(this, 4);
  };


  // Export


  Big = _Big_();

  Big['default'] = Big.Big = Big;

  //AMD.
  if (typeof define === 'function' && define.amd) {
    define(function () { return Big; });

  // Node and other CommonJS-like environments that support module.exports.
  } else if ( true && module.exports) {
    module.exports = Big;

  //Browser.
  } else {
    GLOBAL.Big = Big;
  }
})(this);


/***/ }),

/***/ 3717:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var concatMap = __webpack_require__(6891);
var balanced = __webpack_require__(9417);

module.exports = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand(escapeBraces(str), true).map(unescapeBraces);
}

function identity(e) {
  return e;
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length)
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}



/***/ }),

/***/ 639:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/**
 * Module dependenices
 */

const clone = __webpack_require__(5509);
const typeOf = __webpack_require__(6961);
const isPlainObject = __webpack_require__(7810);

function cloneDeep(val, instanceClone) {
  switch (typeOf(val)) {
    case 'object':
      return cloneObjectDeep(val, instanceClone);
    case 'array':
      return cloneArrayDeep(val, instanceClone);
    default: {
      return clone(val);
    }
  }
}

function cloneObjectDeep(val, instanceClone) {
  if (typeof instanceClone === 'function') {
    return instanceClone(val);
  }
  if (instanceClone || isPlainObject(val)) {
    const res = new val.constructor();
    for (let key in val) {
      res[key] = cloneDeep(val[key], instanceClone);
    }
    return res;
  }
  return val;
}

function cloneArrayDeep(val, instanceClone) {
  const res = new val.constructor(val.length);
  for (let i = 0; i < val.length; i++) {
    res[i] = cloneDeep(val[i], instanceClone);
  }
  return res;
}

/**
 * Expose `cloneDeep`
 */

module.exports = cloneDeep;


/***/ }),

/***/ 6891:
/***/ ((module) => {

module.exports = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};


/***/ }),

/***/ 3887:
/***/ ((module) => {

module.exports = [
  "🀄️",
  "🃏",
  "🅰️",
  "🅱️",
  "🅾️",
  "🅿️",
  "🆎",
  "🆑",
  "🆒",
  "🆓",
  "🆔",
  "🆕",
  "🆖",
  "🆗",
  "🆘",
  "🆙",
  "🆚",
  "🇦🇨",
  "🇦🇩",
  "🇦🇪",
  "🇦🇫",
  "🇦🇬",
  "🇦🇮",
  "🇦🇱",
  "🇦🇲",
  "🇦🇴",
  "🇦🇶",
  "🇦🇷",
  "🇦🇸",
  "🇦🇹",
  "🇦🇺",
  "🇦🇼",
  "🇦🇽",
  "🇦🇿",
  "🇦",
  "🇧🇦",
  "🇧🇧",
  "🇧🇩",
  "🇧🇪",
  "🇧🇫",
  "🇧🇬",
  "🇧🇭",
  "🇧🇮",
  "🇧🇯",
  "🇧🇱",
  "🇧🇲",
  "🇧🇳",
  "🇧🇴",
  "🇧🇶",
  "🇧🇷",
  "🇧🇸",
  "🇧🇹",
  "🇧🇻",
  "🇧🇼",
  "🇧🇾",
  "🇧🇿",
  "🇧",
  "🇨🇦",
  "🇨🇨",
  "🇨🇩",
  "🇨🇫",
  "🇨🇬",
  "🇨🇭",
  "🇨🇮",
  "🇨🇰",
  "🇨🇱",
  "🇨🇲",
  "🇨🇳",
  "🇨🇴",
  "🇨🇵",
  "🇨🇷",
  "🇨🇺",
  "🇨🇻",
  "🇨🇼",
  "🇨🇽",
  "🇨🇾",
  "🇨🇿",
  "🇨",
  "🇩🇪",
  "🇩🇬",
  "🇩🇯",
  "🇩🇰",
  "🇩🇲",
  "🇩🇴",
  "🇩🇿",
  "🇩",
  "🇪🇦",
  "🇪🇨",
  "🇪🇪",
  "🇪🇬",
  "🇪🇭",
  "🇪🇷",
  "🇪🇸",
  "🇪🇹",
  "🇪🇺",
  "🇪",
  "🇫🇮",
  "🇫🇯",
  "🇫🇰",
  "🇫🇲",
  "🇫🇴",
  "🇫🇷",
  "🇫",
  "🇬🇦",
  "🇬🇧",
  "🇬🇩",
  "🇬🇪",
  "🇬🇫",
  "🇬🇬",
  "🇬🇭",
  "🇬🇮",
  "🇬🇱",
  "🇬🇲",
  "🇬🇳",
  "🇬🇵",
  "🇬🇶",
  "🇬🇷",
  "🇬🇸",
  "🇬🇹",
  "🇬🇺",
  "🇬🇼",
  "🇬🇾",
  "🇬",
  "🇭🇰",
  "🇭🇲",
  "🇭🇳",
  "🇭🇷",
  "🇭🇹",
  "🇭🇺",
  "🇭",
  "🇮🇨",
  "🇮🇩",
  "🇮🇪",
  "🇮🇱",
  "🇮🇲",
  "🇮🇳",
  "🇮🇴",
  "🇮🇶",
  "🇮🇷",
  "🇮🇸",
  "🇮🇹",
  "🇮",
  "🇯🇪",
  "🇯🇲",
  "🇯🇴",
  "🇯🇵",
  "🇯",
  "🇰🇪",
  "🇰🇬",
  "🇰🇭",
  "🇰🇮",
  "🇰🇲",
  "🇰🇳",
  "🇰🇵",
  "🇰🇷",
  "🇰🇼",
  "🇰🇾",
  "🇰🇿",
  "🇰",
  "🇱🇦",
  "🇱🇧",
  "🇱🇨",
  "🇱🇮",
  "🇱🇰",
  "🇱🇷",
  "🇱🇸",
  "🇱🇹",
  "🇱🇺",
  "🇱🇻",
  "🇱🇾",
  "🇱",
  "🇲🇦",
  "🇲🇨",
  "🇲🇩",
  "🇲🇪",
  "🇲🇫",
  "🇲🇬",
  "🇲🇭",
  "🇲🇰",
  "🇲🇱",
  "🇲🇲",
  "🇲🇳",
  "🇲🇴",
  "🇲🇵",
  "🇲🇶",
  "🇲🇷",
  "🇲🇸",
  "🇲🇹",
  "🇲🇺",
  "🇲🇻",
  "🇲🇼",
  "🇲🇽",
  "🇲🇾",
  "🇲🇿",
  "🇲",
  "🇳🇦",
  "🇳🇨",
  "🇳🇪",
  "🇳🇫",
  "🇳🇬",
  "🇳🇮",
  "🇳🇱",
  "🇳🇴",
  "🇳🇵",
  "🇳🇷",
  "🇳🇺",
  "🇳🇿",
  "🇳",
  "🇴🇲",
  "🇴",
  "🇵🇦",
  "🇵🇪",
  "🇵🇫",
  "🇵🇬",
  "🇵🇭",
  "🇵🇰",
  "🇵🇱",
  "🇵🇲",
  "🇵🇳",
  "🇵🇷",
  "🇵🇸",
  "🇵🇹",
  "🇵🇼",
  "🇵🇾",
  "🇵",
  "🇶🇦",
  "🇶",
  "🇷🇪",
  "🇷🇴",
  "🇷🇸",
  "🇷🇺",
  "🇷🇼",
  "🇷",
  "🇸🇦",
  "🇸🇧",
  "🇸🇨",
  "🇸🇩",
  "🇸🇪",
  "🇸🇬",
  "🇸🇭",
  "🇸🇮",
  "🇸🇯",
  "🇸🇰",
  "🇸🇱",
  "🇸🇲",
  "🇸🇳",
  "🇸🇴",
  "🇸🇷",
  "🇸🇸",
  "🇸🇹",
  "🇸🇻",
  "🇸🇽",
  "🇸🇾",
  "🇸🇿",
  "🇸",
  "🇹🇦",
  "🇹🇨",
  "🇹🇩",
  "🇹🇫",
  "🇹🇬",
  "🇹🇭",
  "🇹🇯",
  "🇹🇰",
  "🇹🇱",
  "🇹🇲",
  "🇹🇳",
  "🇹🇴",
  "🇹🇷",
  "🇹🇹",
  "🇹🇻",
  "🇹🇼",
  "🇹🇿",
  "🇹",
  "🇺🇦",
  "🇺🇬",
  "🇺🇲",
  "🇺🇳",
  "🇺🇸",
  "🇺🇾",
  "🇺🇿",
  "🇺",
  "🇻🇦",
  "🇻🇨",
  "🇻🇪",
  "🇻🇬",
  "🇻🇮",
  "🇻🇳",
  "🇻🇺",
  "🇻",
  "🇼🇫",
  "🇼🇸",
  "🇼",
  "🇽🇰",
  "🇽",
  "🇾🇪",
  "🇾🇹",
  "🇾",
  "🇿🇦",
  "🇿🇲",
  "🇿🇼",
  "🇿",
  "🈁",
  "🈂️",
  "🈚️",
  "🈯️",
  "🈲",
  "🈳",
  "🈴",
  "🈵",
  "🈶",
  "🈷️",
  "🈸",
  "🈹",
  "🈺",
  "🉐",
  "🉑",
  "🌀",
  "🌁",
  "🌂",
  "🌃",
  "🌄",
  "🌅",
  "🌆",
  "🌇",
  "🌈",
  "🌉",
  "🌊",
  "🌋",
  "🌌",
  "🌍",
  "🌎",
  "🌏",
  "🌐",
  "🌑",
  "🌒",
  "🌓",
  "🌔",
  "🌕",
  "🌖",
  "🌗",
  "🌘",
  "🌙",
  "🌚",
  "🌛",
  "🌜",
  "🌝",
  "🌞",
  "🌟",
  "🌠",
  "🌡️",
  "🌤️",
  "🌥️",
  "🌦️",
  "🌧️",
  "🌨️",
  "🌩️",
  "🌪️",
  "🌫️",
  "🌬️",
  "🌭",
  "🌮",
  "🌯",
  "🌰",
  "🌱",
  "🌲",
  "🌳",
  "🌴",
  "🌵",
  "🌶️",
  "🌷",
  "🌸",
  "🌹",
  "🌺",
  "🌻",
  "🌼",
  "🌽",
  "🌾",
  "🌿",
  "🍀",
  "🍁",
  "🍂",
  "🍃",
  "🍄",
  "🍅",
  "🍆",
  "🍇",
  "🍈",
  "🍉",
  "🍊",
  "🍋",
  "🍌",
  "🍍",
  "🍎",
  "🍏",
  "🍐",
  "🍑",
  "🍒",
  "🍓",
  "🍔",
  "🍕",
  "🍖",
  "🍗",
  "🍘",
  "🍙",
  "🍚",
  "🍛",
  "🍜",
  "🍝",
  "🍞",
  "🍟",
  "🍠",
  "🍡",
  "🍢",
  "🍣",
  "🍤",
  "🍥",
  "🍦",
  "🍧",
  "🍨",
  "🍩",
  "🍪",
  "🍫",
  "🍬",
  "🍭",
  "🍮",
  "🍯",
  "🍰",
  "🍱",
  "🍲",
  "🍳",
  "🍴",
  "🍵",
  "🍶",
  "🍷",
  "🍸",
  "🍹",
  "🍺",
  "🍻",
  "🍼",
  "🍽️",
  "🍾",
  "🍿",
  "🎀",
  "🎁",
  "🎂",
  "🎃",
  "🎄",
  "🎅🏻",
  "🎅🏼",
  "🎅🏽",
  "🎅🏾",
  "🎅🏿",
  "🎅",
  "🎆",
  "🎇",
  "🎈",
  "🎉",
  "🎊",
  "🎋",
  "🎌",
  "🎍",
  "🎎",
  "🎏",
  "🎐",
  "🎑",
  "🎒",
  "🎓",
  "🎖️",
  "🎗️",
  "🎙️",
  "🎚️",
  "🎛️",
  "🎞️",
  "🎟️",
  "🎠",
  "🎡",
  "🎢",
  "🎣",
  "🎤",
  "🎥",
  "🎦",
  "🎧",
  "🎨",
  "🎩",
  "🎪",
  "🎫",
  "🎬",
  "🎭",
  "🎮",
  "🎯",
  "🎰",
  "🎱",
  "🎲",
  "🎳",
  "🎴",
  "🎵",
  "🎶",
  "🎷",
  "🎸",
  "🎹",
  "🎺",
  "🎻",
  "🎼",
  "🎽",
  "🎾",
  "🎿",
  "🏀",
  "🏁",
  "🏂🏻",
  "🏂🏼",
  "🏂🏽",
  "🏂🏾",
  "🏂🏿",
  "🏂",
  "🏃🏻‍♀️",
  "🏃🏻‍♂️",
  "🏃🏻",
  "🏃🏼‍♀️",
  "🏃🏼‍♂️",
  "🏃🏼",
  "🏃🏽‍♀️",
  "🏃🏽‍♂️",
  "🏃🏽",
  "🏃🏾‍♀️",
  "🏃🏾‍♂️",
  "🏃🏾",
  "🏃🏿‍♀️",
  "🏃🏿‍♂️",
  "🏃🏿",
  "🏃‍♀️",
  "🏃‍♂️",
  "🏃",
  "🏄🏻‍♀️",
  "🏄🏻‍♂️",
  "🏄🏻",
  "🏄🏼‍♀️",
  "🏄🏼‍♂️",
  "🏄🏼",
  "🏄🏽‍♀️",
  "🏄🏽‍♂️",
  "🏄🏽",
  "🏄🏾‍♀️",
  "🏄🏾‍♂️",
  "🏄🏾",
  "🏄🏿‍♀️",
  "🏄🏿‍♂️",
  "🏄🏿",
  "🏄‍♀️",
  "🏄‍♂️",
  "🏄",
  "🏅",
  "🏆",
  "🏇🏻",
  "🏇🏼",
  "🏇🏽",
  "🏇🏾",
  "🏇🏿",
  "🏇",
  "🏈",
  "🏉",
  "🏊🏻‍♀️",
  "🏊🏻‍♂️",
  "🏊🏻",
  "🏊🏼‍♀️",
  "🏊🏼‍♂️",
  "🏊🏼",
  "🏊🏽‍♀️",
  "🏊🏽‍♂️",
  "🏊🏽",
  "🏊🏾‍♀️",
  "🏊🏾‍♂️",
  "🏊🏾",
  "🏊🏿‍♀️",
  "🏊🏿‍♂️",
  "🏊🏿",
  "🏊‍♀️",
  "🏊‍♂️",
  "🏊",
  "🏋🏻‍♀️",
  "🏋🏻‍♂️",
  "🏋🏻",
  "🏋🏼‍♀️",
  "🏋🏼‍♂️",
  "🏋🏼",
  "🏋🏽‍♀️",
  "🏋🏽‍♂️",
  "🏋🏽",
  "🏋🏾‍♀️",
  "🏋🏾‍♂️",
  "🏋🏾",
  "🏋🏿‍♀️",
  "🏋🏿‍♂️",
  "🏋🏿",
  "🏋️‍♀️",
  "🏋️‍♂️",
  "🏋️",
  "🏌🏻‍♀️",
  "🏌🏻‍♂️",
  "🏌🏻",
  "🏌🏼‍♀️",
  "🏌🏼‍♂️",
  "🏌🏼",
  "🏌🏽‍♀️",
  "🏌🏽‍♂️",
  "🏌🏽",
  "🏌🏾‍♀️",
  "🏌🏾‍♂️",
  "🏌🏾",
  "🏌🏿‍♀️",
  "🏌🏿‍♂️",
  "🏌🏿",
  "🏌️‍♀️",
  "🏌️‍♂️",
  "🏌️",
  "🏍️",
  "🏎️",
  "🏏",
  "🏐",
  "🏑",
  "🏒",
  "🏓",
  "🏔️",
  "🏕️",
  "🏖️",
  "🏗️",
  "🏘️",
  "🏙️",
  "🏚️",
  "🏛️",
  "🏜️",
  "🏝️",
  "🏞️",
  "🏟️",
  "🏠",
  "🏡",
  "🏢",
  "🏣",
  "🏤",
  "🏥",
  "🏦",
  "🏧",
  "🏨",
  "🏩",
  "🏪",
  "🏫",
  "🏬",
  "🏭",
  "🏮",
  "🏯",
  "🏰",
  "🏳️‍🌈",
  "🏳️",
  "🏴‍☠️",
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "🏴",
  "🏵️",
  "🏷️",
  "🏸",
  "🏹",
  "🏺",
  "🏻",
  "🏼",
  "🏽",
  "🏾",
  "🏿",
  "🐀",
  "🐁",
  "🐂",
  "🐃",
  "🐄",
  "🐅",
  "🐆",
  "🐇",
  "🐈",
  "🐉",
  "🐊",
  "🐋",
  "🐌",
  "🐍",
  "🐎",
  "🐏",
  "🐐",
  "🐑",
  "🐒",
  "🐓",
  "🐔",
  "🐕‍🦺",
  "🐕",
  "🐖",
  "🐗",
  "🐘",
  "🐙",
  "🐚",
  "🐛",
  "🐜",
  "🐝",
  "🐞",
  "🐟",
  "🐠",
  "🐡",
  "🐢",
  "🐣",
  "🐤",
  "🐥",
  "🐦",
  "🐧",
  "🐨",
  "🐩",
  "🐪",
  "🐫",
  "🐬",
  "🐭",
  "🐮",
  "🐯",
  "🐰",
  "🐱",
  "🐲",
  "🐳",
  "🐴",
  "🐵",
  "🐶",
  "🐷",
  "🐸",
  "🐹",
  "🐺",
  "🐻",
  "🐼",
  "🐽",
  "🐾",
  "🐿️",
  "👀",
  "👁‍🗨",
  "👁️",
  "👂🏻",
  "👂🏼",
  "👂🏽",
  "👂🏾",
  "👂🏿",
  "👂",
  "👃🏻",
  "👃🏼",
  "👃🏽",
  "👃🏾",
  "👃🏿",
  "👃",
  "👄",
  "👅",
  "👆🏻",
  "👆🏼",
  "👆🏽",
  "👆🏾",
  "👆🏿",
  "👆",
  "👇🏻",
  "👇🏼",
  "👇🏽",
  "👇🏾",
  "👇🏿",
  "👇",
  "👈🏻",
  "👈🏼",
  "👈🏽",
  "👈🏾",
  "👈🏿",
  "👈",
  "👉🏻",
  "👉🏼",
  "👉🏽",
  "👉🏾",
  "👉🏿",
  "👉",
  "👊🏻",
  "👊🏼",
  "👊🏽",
  "👊🏾",
  "👊🏿",
  "👊",
  "👋🏻",
  "👋🏼",
  "👋🏽",
  "👋🏾",
  "👋🏿",
  "👋",
  "👌🏻",
  "👌🏼",
  "👌🏽",
  "👌🏾",
  "👌🏿",
  "👌",
  "👍🏻",
  "👍🏼",
  "👍🏽",
  "👍🏾",
  "👍🏿",
  "👍",
  "👎🏻",
  "👎🏼",
  "👎🏽",
  "👎🏾",
  "👎🏿",
  "👎",
  "👏🏻",
  "👏🏼",
  "👏🏽",
  "👏🏾",
  "👏🏿",
  "👏",
  "👐🏻",
  "👐🏼",
  "👐🏽",
  "👐🏾",
  "👐🏿",
  "👐",
  "👑",
  "👒",
  "👓",
  "👔",
  "👕",
  "👖",
  "👗",
  "👘",
  "👙",
  "👚",
  "👛",
  "👜",
  "👝",
  "👞",
  "👟",
  "👠",
  "👡",
  "👢",
  "👣",
  "👤",
  "👥",
  "👦🏻",
  "👦🏼",
  "👦🏽",
  "👦🏾",
  "👦🏿",
  "👦",
  "👧🏻",
  "👧🏼",
  "👧🏽",
  "👧🏾",
  "👧🏿",
  "👧",
  "👨🏻‍🌾",
  "👨🏻‍🍳",
  "👨🏻‍🎓",
  "👨🏻‍🎤",
  "👨🏻‍🎨",
  "👨🏻‍🏫",
  "👨🏻‍🏭",
  "👨🏻‍💻",
  "👨🏻‍💼",
  "👨🏻‍🔧",
  "👨🏻‍🔬",
  "👨🏻‍🚀",
  "👨🏻‍🚒",
  "👨🏻‍🦯",
  "👨🏻‍🦰",
  "👨🏻‍🦱",
  "👨🏻‍🦲",
  "👨🏻‍🦳",
  "👨🏻‍🦼",
  "👨🏻‍🦽",
  "👨🏻‍⚕️",
  "👨🏻‍⚖️",
  "👨🏻‍✈️",
  "👨🏻",
  "👨🏼‍🌾",
  "👨🏼‍🍳",
  "👨🏼‍🎓",
  "👨🏼‍🎤",
  "👨🏼‍🎨",
  "👨🏼‍🏫",
  "👨🏼‍🏭",
  "👨🏼‍💻",
  "👨🏼‍💼",
  "👨🏼‍🔧",
  "👨🏼‍🔬",
  "👨🏼‍🚀",
  "👨🏼‍🚒",
  "👨🏼‍🤝‍👨🏻",
  "👨🏼‍🦯",
  "👨🏼‍🦰",
  "👨🏼‍🦱",
  "👨🏼‍🦲",
  "👨🏼‍🦳",
  "👨🏼‍🦼",
  "👨🏼‍🦽",
  "👨🏼‍⚕️",
  "👨🏼‍⚖️",
  "👨🏼‍✈️",
  "👨🏼",
  "👨🏽‍🌾",
  "👨🏽‍🍳",
  "👨🏽‍🎓",
  "👨🏽‍🎤",
  "👨🏽‍🎨",
  "👨🏽‍🏫",
  "👨🏽‍🏭",
  "👨🏽‍💻",
  "👨🏽‍💼",
  "👨🏽‍🔧",
  "👨🏽‍🔬",
  "👨🏽‍🚀",
  "👨🏽‍🚒",
  "👨🏽‍🤝‍👨🏻",
  "👨🏽‍🤝‍👨🏼",
  "👨🏽‍🦯",
  "👨🏽‍🦰",
  "👨🏽‍🦱",
  "👨🏽‍🦲",
  "👨🏽‍🦳",
  "👨🏽‍🦼",
  "👨🏽‍🦽",
  "👨🏽‍⚕️",
  "👨🏽‍⚖️",
  "👨🏽‍✈️",
  "👨🏽",
  "👨🏾‍🌾",
  "👨🏾‍🍳",
  "👨🏾‍🎓",
  "👨🏾‍🎤",
  "👨🏾‍🎨",
  "👨🏾‍🏫",
  "👨🏾‍🏭",
  "👨🏾‍💻",
  "👨🏾‍💼",
  "👨🏾‍🔧",
  "👨🏾‍🔬",
  "👨🏾‍🚀",
  "👨🏾‍🚒",
  "👨🏾‍🤝‍👨🏻",
  "👨🏾‍🤝‍👨🏼",
  "👨🏾‍🤝‍👨🏽",
  "👨🏾‍🦯",
  "👨🏾‍🦰",
  "👨🏾‍🦱",
  "👨🏾‍🦲",
  "👨🏾‍🦳",
  "👨🏾‍🦼",
  "👨🏾‍🦽",
  "👨🏾‍⚕️",
  "👨🏾‍⚖️",
  "👨🏾‍✈️",
  "👨🏾",
  "👨🏿‍🌾",
  "👨🏿‍🍳",
  "👨🏿‍🎓",
  "👨🏿‍🎤",
  "👨🏿‍🎨",
  "👨🏿‍🏫",
  "👨🏿‍🏭",
  "👨🏿‍💻",
  "👨🏿‍💼",
  "👨🏿‍🔧",
  "👨🏿‍🔬",
  "👨🏿‍🚀",
  "👨🏿‍🚒",
  "👨🏿‍🤝‍👨🏻",
  "👨🏿‍🤝‍👨🏼",
  "👨🏿‍🤝‍👨🏽",
  "👨🏿‍🤝‍👨🏾",
  "👨🏿‍🦯",
  "👨🏿‍🦰",
  "👨🏿‍🦱",
  "👨🏿‍🦲",
  "👨🏿‍🦳",
  "👨🏿‍🦼",
  "👨🏿‍🦽",
  "👨🏿‍⚕️",
  "👨🏿‍⚖️",
  "👨🏿‍✈️",
  "👨🏿",
  "👨‍🌾",
  "👨‍🍳",
  "👨‍🎓",
  "👨‍🎤",
  "👨‍🎨",
  "👨‍🏫",
  "👨‍🏭",
  "👨‍👦‍👦",
  "👨‍👦",
  "👨‍👧‍👦",
  "👨‍👧‍👧",
  "👨‍👧",
  "👨‍👨‍👦‍👦",
  "👨‍👨‍👦",
  "👨‍👨‍👧‍👦",
  "👨‍👨‍👧‍👧",
  "👨‍👨‍👧",
  "👨‍👩‍👦‍👦",
  "👨‍👩‍👦",
  "👨‍👩‍👧‍👦",
  "👨‍👩‍👧‍👧",
  "👨‍👩‍👧",
  "👨‍💻",
  "👨‍💼",
  "👨‍🔧",
  "👨‍🔬",
  "👨‍🚀",
  "👨‍🚒",
  "👨‍🦯",
  "👨‍🦰",
  "👨‍🦱",
  "👨‍🦲",
  "👨‍🦳",
  "👨‍🦼",
  "👨‍🦽",
  "👨‍⚕️",
  "👨‍⚖️",
  "👨‍✈️",
  "👨‍❤️‍👨",
  "👨‍❤️‍💋‍👨",
  "👨",
  "👩🏻‍🌾",
  "👩🏻‍🍳",
  "👩🏻‍🎓",
  "👩🏻‍🎤",
  "👩🏻‍🎨",
  "👩🏻‍🏫",
  "👩🏻‍🏭",
  "👩🏻‍💻",
  "👩🏻‍💼",
  "👩🏻‍🔧",
  "👩🏻‍🔬",
  "👩🏻‍🚀",
  "👩🏻‍🚒",
  "👩🏻‍🤝‍👨🏼",
  "👩🏻‍🤝‍👨🏽",
  "👩🏻‍🤝‍👨🏾",
  "👩🏻‍🤝‍👨🏿",
  "👩🏻‍🦯",
  "👩🏻‍🦰",
  "👩🏻‍🦱",
  "👩🏻‍🦲",
  "👩🏻‍🦳",
  "👩🏻‍🦼",
  "👩🏻‍🦽",
  "👩🏻‍⚕️",
  "👩🏻‍⚖️",
  "👩🏻‍✈️",
  "👩🏻",
  "👩🏼‍🌾",
  "👩🏼‍🍳",
  "👩🏼‍🎓",
  "👩🏼‍🎤",
  "👩🏼‍🎨",
  "👩🏼‍🏫",
  "👩🏼‍🏭",
  "👩🏼‍💻",
  "👩🏼‍💼",
  "👩🏼‍🔧",
  "👩🏼‍🔬",
  "👩🏼‍🚀",
  "👩🏼‍🚒",
  "👩🏼‍🤝‍👨🏻",
  "👩🏼‍🤝‍👨🏽",
  "👩🏼‍🤝‍👨🏾",
  "👩🏼‍🤝‍👨🏿",
  "👩🏼‍🤝‍👩🏻",
  "👩🏼‍🦯",
  "👩🏼‍🦰",
  "👩🏼‍🦱",
  "👩🏼‍🦲",
  "👩🏼‍🦳",
  "👩🏼‍🦼",
  "👩🏼‍🦽",
  "👩🏼‍⚕️",
  "👩🏼‍⚖️",
  "👩🏼‍✈️",
  "👩🏼",
  "👩🏽‍🌾",
  "👩🏽‍🍳",
  "👩🏽‍🎓",
  "👩🏽‍🎤",
  "👩🏽‍🎨",
  "👩🏽‍🏫",
  "👩🏽‍🏭",
  "👩🏽‍💻",
  "👩🏽‍💼",
  "👩🏽‍🔧",
  "👩🏽‍🔬",
  "👩🏽‍🚀",
  "👩🏽‍🚒",
  "👩🏽‍🤝‍👨🏻",
  "👩🏽‍🤝‍👨🏼",
  "👩🏽‍🤝‍👨🏾",
  "👩🏽‍🤝‍👨🏿",
  "👩🏽‍🤝‍👩🏻",
  "👩🏽‍🤝‍👩🏼",
  "👩🏽‍🦯",
  "👩🏽‍🦰",
  "👩🏽‍🦱",
  "👩🏽‍🦲",
  "👩🏽‍🦳",
  "👩🏽‍🦼",
  "👩🏽‍🦽",
  "👩🏽‍⚕️",
  "👩🏽‍⚖️",
  "👩🏽‍✈️",
  "👩🏽",
  "👩🏾‍🌾",
  "👩🏾‍🍳",
  "👩🏾‍🎓",
  "👩🏾‍🎤",
  "👩🏾‍🎨",
  "👩🏾‍🏫",
  "👩🏾‍🏭",
  "👩🏾‍💻",
  "👩🏾‍💼",
  "👩🏾‍🔧",
  "👩🏾‍🔬",
  "👩🏾‍🚀",
  "👩🏾‍🚒",
  "👩🏾‍🤝‍👨🏻",
  "👩🏾‍🤝‍👨🏼",
  "👩🏾‍🤝‍👨🏽",
  "👩🏾‍🤝‍👨🏿",
  "👩🏾‍🤝‍👩🏻",
  "👩🏾‍🤝‍👩🏼",
  "👩🏾‍🤝‍👩🏽",
  "👩🏾‍🦯",
  "👩🏾‍🦰",
  "👩🏾‍🦱",
  "👩🏾‍🦲",
  "👩🏾‍🦳",
  "👩🏾‍🦼",
  "👩🏾‍🦽",
  "👩🏾‍⚕️",
  "👩🏾‍⚖️",
  "👩🏾‍✈️",
  "👩🏾",
  "👩🏿‍🌾",
  "👩🏿‍🍳",
  "👩🏿‍🎓",
  "👩🏿‍🎤",
  "👩🏿‍🎨",
  "👩🏿‍🏫",
  "👩🏿‍🏭",
  "👩🏿‍💻",
  "👩🏿‍💼",
  "👩🏿‍🔧",
  "👩🏿‍🔬",
  "👩🏿‍🚀",
  "👩🏿‍🚒",
  "👩🏿‍🤝‍👨🏻",
  "👩🏿‍🤝‍👨🏼",
  "👩🏿‍🤝‍👨🏽",
  "👩🏿‍🤝‍👨🏾",
  "👩🏿‍🤝‍👩🏻",
  "👩🏿‍🤝‍👩🏼",
  "👩🏿‍🤝‍👩🏽",
  "👩🏿‍🤝‍👩🏾",
  "👩🏿‍🦯",
  "👩🏿‍🦰",
  "👩🏿‍🦱",
  "👩🏿‍🦲",
  "👩🏿‍🦳",
  "👩🏿‍🦼",
  "👩🏿‍🦽",
  "👩🏿‍⚕️",
  "👩🏿‍⚖️",
  "👩🏿‍✈️",
  "👩🏿",
  "👩‍🌾",
  "👩‍🍳",
  "👩‍🎓",
  "👩‍🎤",
  "👩‍🎨",
  "👩‍🏫",
  "👩‍🏭",
  "👩‍👦‍👦",
  "👩‍👦",
  "👩‍👧‍👦",
  "👩‍👧‍👧",
  "👩‍👧",
  "👩‍👩‍👦‍👦",
  "👩‍👩‍👦",
  "👩‍👩‍👧‍👦",
  "👩‍👩‍👧‍👧",
  "👩‍👩‍👧",
  "👩‍💻",
  "👩‍💼",
  "👩‍🔧",
  "👩‍🔬",
  "👩‍🚀",
  "👩‍🚒",
  "👩‍🦯",
  "👩‍🦰",
  "👩‍🦱",
  "👩‍🦲",
  "👩‍🦳",
  "👩‍🦼",
  "👩‍🦽",
  "👩‍⚕️",
  "👩‍⚖️",
  "👩‍✈️",
  "👩‍❤️‍👨",
  "👩‍❤️‍👩",
  "👩‍❤️‍💋‍👨",
  "👩‍❤️‍💋‍👩",
  "👩",
  "👪",
  "👫🏻",
  "👫🏼",
  "👫🏽",
  "👫🏾",
  "👫🏿",
  "👫",
  "👬🏻",
  "👬🏼",
  "👬🏽",
  "👬🏾",
  "👬🏿",
  "👬",
  "👭🏻",
  "👭🏼",
  "👭🏽",
  "👭🏾",
  "👭🏿",
  "👭",
  "👮🏻‍♀️",
  "👮🏻‍♂️",
  "👮🏻",
  "👮🏼‍♀️",
  "👮🏼‍♂️",
  "👮🏼",
  "👮🏽‍♀️",
  "👮🏽‍♂️",
  "👮🏽",
  "👮🏾‍♀️",
  "👮🏾‍♂️",
  "👮🏾",
  "👮🏿‍♀️",
  "👮🏿‍♂️",
  "👮🏿",
  "👮‍♀️",
  "👮‍♂️",
  "👮",
  "👯‍♀️",
  "👯‍♂️",
  "👯",
  "👰🏻",
  "👰🏼",
  "👰🏽",
  "👰🏾",
  "👰🏿",
  "👰",
  "👱🏻‍♀️",
  "👱🏻‍♂️",
  "👱🏻",
  "👱🏼‍♀️",
  "👱🏼‍♂️",
  "👱🏼",
  "👱🏽‍♀️",
  "👱🏽‍♂️",
  "👱🏽",
  "👱🏾‍♀️",
  "👱🏾‍♂️",
  "👱🏾",
  "👱🏿‍♀️",
  "👱🏿‍♂️",
  "👱🏿",
  "👱‍♀️",
  "👱‍♂️",
  "👱",
  "👲🏻",
  "👲🏼",
  "👲🏽",
  "👲🏾",
  "👲🏿",
  "👲",
  "👳🏻‍♀️",
  "👳🏻‍♂️",
  "👳🏻",
  "👳🏼‍♀️",
  "👳🏼‍♂️",
  "👳🏼",
  "👳🏽‍♀️",
  "👳🏽‍♂️",
  "👳🏽",
  "👳🏾‍♀️",
  "👳🏾‍♂️",
  "👳🏾",
  "👳🏿‍♀️",
  "👳🏿‍♂️",
  "👳🏿",
  "👳‍♀️",
  "👳‍♂️",
  "👳",
  "👴🏻",
  "👴🏼",
  "👴🏽",
  "👴🏾",
  "👴🏿",
  "👴",
  "👵🏻",
  "👵🏼",
  "👵🏽",
  "👵🏾",
  "👵🏿",
  "👵",
  "👶🏻",
  "👶🏼",
  "👶🏽",
  "👶🏾",
  "👶🏿",
  "👶",
  "👷🏻‍♀️",
  "👷🏻‍♂️",
  "👷🏻",
  "👷🏼‍♀️",
  "👷🏼‍♂️",
  "👷🏼",
  "👷🏽‍♀️",
  "👷🏽‍♂️",
  "👷🏽",
  "👷🏾‍♀️",
  "👷🏾‍♂️",
  "👷🏾",
  "👷🏿‍♀️",
  "👷🏿‍♂️",
  "👷🏿",
  "👷‍♀️",
  "👷‍♂️",
  "👷",
  "👸🏻",
  "👸🏼",
  "👸🏽",
  "👸🏾",
  "👸🏿",
  "👸",
  "👹",
  "👺",
  "👻",
  "👼🏻",
  "👼🏼",
  "👼🏽",
  "👼🏾",
  "👼🏿",
  "👼",
  "👽",
  "👾",
  "👿",
  "💀",
  "💁🏻‍♀️",
  "💁🏻‍♂️",
  "💁🏻",
  "💁🏼‍♀️",
  "💁🏼‍♂️",
  "💁🏼",
  "💁🏽‍♀️",
  "💁🏽‍♂️",
  "💁🏽",
  "💁🏾‍♀️",
  "💁🏾‍♂️",
  "💁🏾",
  "💁🏿‍♀️",
  "💁🏿‍♂️",
  "💁🏿",
  "💁‍♀️",
  "💁‍♂️",
  "💁",
  "💂🏻‍♀️",
  "💂🏻‍♂️",
  "💂🏻",
  "💂🏼‍♀️",
  "💂🏼‍♂️",
  "💂🏼",
  "💂🏽‍♀️",
  "💂🏽‍♂️",
  "💂🏽",
  "💂🏾‍♀️",
  "💂🏾‍♂️",
  "💂🏾",
  "💂🏿‍♀️",
  "💂🏿‍♂️",
  "💂🏿",
  "💂‍♀️",
  "💂‍♂️",
  "💂",
  "💃🏻",
  "💃🏼",
  "💃🏽",
  "💃🏾",
  "💃🏿",
  "💃",
  "💄",
  "💅🏻",
  "💅🏼",
  "💅🏽",
  "💅🏾",
  "💅🏿",
  "💅",
  "💆🏻‍♀️",
  "💆🏻‍♂️",
  "💆🏻",
  "💆🏼‍♀️",
  "💆🏼‍♂️",
  "💆🏼",
  "💆🏽‍♀️",
  "💆🏽‍♂️",
  "💆🏽",
  "💆🏾‍♀️",
  "💆🏾‍♂️",
  "💆🏾",
  "💆🏿‍♀️",
  "💆🏿‍♂️",
  "💆🏿",
  "💆‍♀️",
  "💆‍♂️",
  "💆",
  "💇🏻‍♀️",
  "💇🏻‍♂️",
  "💇🏻",
  "💇🏼‍♀️",
  "💇🏼‍♂️",
  "💇🏼",
  "💇🏽‍♀️",
  "💇🏽‍♂️",
  "💇🏽",
  "💇🏾‍♀️",
  "💇🏾‍♂️",
  "💇🏾",
  "💇🏿‍♀️",
  "💇🏿‍♂️",
  "💇🏿",
  "💇‍♀️",
  "💇‍♂️",
  "💇",
  "💈",
  "💉",
  "💊",
  "💋",
  "💌",
  "💍",
  "💎",
  "💏",
  "💐",
  "💑",
  "💒",
  "💓",
  "💔",
  "💕",
  "💖",
  "💗",
  "💘",
  "💙",
  "💚",
  "💛",
  "💜",
  "💝",
  "💞",
  "💟",
  "💠",
  "💡",
  "💢",
  "💣",
  "💤",
  "💥",
  "💦",
  "💧",
  "💨",
  "💩",
  "💪🏻",
  "💪🏼",
  "💪🏽",
  "💪🏾",
  "💪🏿",
  "💪",
  "💫",
  "💬",
  "💭",
  "💮",
  "💯",
  "💰",
  "💱",
  "💲",
  "💳",
  "💴",
  "💵",
  "💶",
  "💷",
  "💸",
  "💹",
  "💺",
  "💻",
  "💼",
  "💽",
  "💾",
  "💿",
  "📀",
  "📁",
  "📂",
  "📃",
  "📄",
  "📅",
  "📆",
  "📇",
  "📈",
  "📉",
  "📊",
  "📋",
  "📌",
  "📍",
  "📎",
  "📏",
  "📐",
  "📑",
  "📒",
  "📓",
  "📔",
  "📕",
  "📖",
  "📗",
  "📘",
  "📙",
  "📚",
  "📛",
  "📜",
  "📝",
  "📞",
  "📟",
  "📠",
  "📡",
  "📢",
  "📣",
  "📤",
  "📥",
  "📦",
  "📧",
  "📨",
  "📩",
  "📪",
  "📫",
  "📬",
  "📭",
  "📮",
  "📯",
  "📰",
  "📱",
  "📲",
  "📳",
  "📴",
  "📵",
  "📶",
  "📷",
  "📸",
  "📹",
  "📺",
  "📻",
  "📼",
  "📽️",
  "📿",
  "🔀",
  "🔁",
  "🔂",
  "🔃",
  "🔄",
  "🔅",
  "🔆",
  "🔇",
  "🔈",
  "🔉",
  "🔊",
  "🔋",
  "🔌",
  "🔍",
  "🔎",
  "🔏",
  "🔐",
  "🔑",
  "🔒",
  "🔓",
  "🔔",
  "🔕",
  "🔖",
  "🔗",
  "🔘",
  "🔙",
  "🔚",
  "🔛",
  "🔜",
  "🔝",
  "🔞",
  "🔟",
  "🔠",
  "🔡",
  "🔢",
  "🔣",
  "🔤",
  "🔥",
  "🔦",
  "🔧",
  "🔨",
  "🔩",
  "🔪",
  "🔫",
  "🔬",
  "🔭",
  "🔮",
  "🔯",
  "🔰",
  "🔱",
  "🔲",
  "🔳",
  "🔴",
  "🔵",
  "🔶",
  "🔷",
  "🔸",
  "🔹",
  "🔺",
  "🔻",
  "🔼",
  "🔽",
  "🕉️",
  "🕊️",
  "🕋",
  "🕌",
  "🕍",
  "🕎",
  "🕐",
  "🕑",
  "🕒",
  "🕓",
  "🕔",
  "🕕",
  "🕖",
  "🕗",
  "🕘",
  "🕙",
  "🕚",
  "🕛",
  "🕜",
  "🕝",
  "🕞",
  "🕟",
  "🕠",
  "🕡",
  "🕢",
  "🕣",
  "🕤",
  "🕥",
  "🕦",
  "🕧",
  "🕯️",
  "🕰️",
  "🕳️",
  "🕴🏻‍♀️",
  "🕴🏻‍♂️",
  "🕴🏻",
  "🕴🏼‍♀️",
  "🕴🏼‍♂️",
  "🕴🏼",
  "🕴🏽‍♀️",
  "🕴🏽‍♂️",
  "🕴🏽",
  "🕴🏾‍♀️",
  "🕴🏾‍♂️",
  "🕴🏾",
  "🕴🏿‍♀️",
  "🕴🏿‍♂️",
  "🕴🏿",
  "🕴️‍♀️",
  "🕴️‍♂️",
  "🕴️",
  "🕵🏻‍♀️",
  "🕵🏻‍♂️",
  "🕵🏻",
  "🕵🏼‍♀️",
  "🕵🏼‍♂️",
  "🕵🏼",
  "🕵🏽‍♀️",
  "🕵🏽‍♂️",
  "🕵🏽",
  "🕵🏾‍♀️",
  "🕵🏾‍♂️",
  "🕵🏾",
  "🕵🏿‍♀️",
  "🕵🏿‍♂️",
  "🕵🏿",
  "🕵️‍♀️",
  "🕵️‍♂️",
  "🕵️",
  "🕶️",
  "🕷️",
  "🕸️",
  "🕹️",
  "🕺🏻",
  "🕺🏼",
  "🕺🏽",
  "🕺🏾",
  "🕺🏿",
  "🕺",
  "🖇️",
  "🖊️",
  "🖋️",
  "🖌️",
  "🖍️",
  "🖐🏻",
  "🖐🏼",
  "🖐🏽",
  "🖐🏾",
  "🖐🏿",
  "🖐️",
  "🖕🏻",
  "🖕🏼",
  "🖕🏽",
  "🖕🏾",
  "🖕🏿",
  "🖕",
  "🖖🏻",
  "🖖🏼",
  "🖖🏽",
  "🖖🏾",
  "🖖🏿",
  "🖖",
  "🖤",
  "🖥️",
  "🖨️",
  "🖱️",
  "🖲️",
  "🖼️",
  "🗂️",
  "🗃️",
  "🗄️",
  "🗑️",
  "🗒️",
  "🗓️",
  "🗜️",
  "🗝️",
  "🗞️",
  "🗡️",
  "🗣️",
  "🗨️",
  "🗯️",
  "🗳️",
  "🗺️",
  "🗻",
  "🗼",
  "🗽",
  "🗾",
  "🗿",
  "😀",
  "😁",
  "😂",
  "😃",
  "😄",
  "😅",
  "😆",
  "😇",
  "😈",
  "😉",
  "😊",
  "😋",
  "😌",
  "😍",
  "😎",
  "😏",
  "😐",
  "😑",
  "😒",
  "😓",
  "😔",
  "😕",
  "😖",
  "😗",
  "😘",
  "😙",
  "😚",
  "😛",
  "😜",
  "😝",
  "😞",
  "😟",
  "😠",
  "😡",
  "😢",
  "😣",
  "😤",
  "😥",
  "😦",
  "😧",
  "😨",
  "😩",
  "😪",
  "😫",
  "😬",
  "😭",
  "😮",
  "😯",
  "😰",
  "😱",
  "😲",
  "😳",
  "😴",
  "😵",
  "😶",
  "😷",
  "😸",
  "😹",
  "😺",
  "😻",
  "😼",
  "😽",
  "😾",
  "😿",
  "🙀",
  "🙁",
  "🙂",
  "🙃",
  "🙄",
  "🙅🏻‍♀️",
  "🙅🏻‍♂️",
  "🙅🏻",
  "🙅🏼‍♀️",
  "🙅🏼‍♂️",
  "🙅🏼",
  "🙅🏽‍♀️",
  "🙅🏽‍♂️",
  "🙅🏽",
  "🙅🏾‍♀️",
  "🙅🏾‍♂️",
  "🙅🏾",
  "🙅🏿‍♀️",
  "🙅🏿‍♂️",
  "🙅🏿",
  "🙅‍♀️",
  "🙅‍♂️",
  "🙅",
  "🙆🏻‍♀️",
  "🙆🏻‍♂️",
  "🙆🏻",
  "🙆🏼‍♀️",
  "🙆🏼‍♂️",
  "🙆🏼",
  "🙆🏽‍♀️",
  "🙆🏽‍♂️",
  "🙆🏽",
  "🙆🏾‍♀️",
  "🙆🏾‍♂️",
  "🙆🏾",
  "🙆🏿‍♀️",
  "🙆🏿‍♂️",
  "🙆🏿",
  "🙆‍♀️",
  "🙆‍♂️",
  "🙆",
  "🙇🏻‍♀️",
  "🙇🏻‍♂️",
  "🙇🏻",
  "🙇🏼‍♀️",
  "🙇🏼‍♂️",
  "🙇🏼",
  "🙇🏽‍♀️",
  "🙇🏽‍♂️",
  "🙇🏽",
  "🙇🏾‍♀️",
  "🙇🏾‍♂️",
  "🙇🏾",
  "🙇🏿‍♀️",
  "🙇🏿‍♂️",
  "🙇🏿",
  "🙇‍♀️",
  "🙇‍♂️",
  "🙇",
  "🙈",
  "🙉",
  "🙊",
  "🙋🏻‍♀️",
  "🙋🏻‍♂️",
  "🙋🏻",
  "🙋🏼‍♀️",
  "🙋🏼‍♂️",
  "🙋🏼",
  "🙋🏽‍♀️",
  "🙋🏽‍♂️",
  "🙋🏽",
  "🙋🏾‍♀️",
  "🙋🏾‍♂️",
  "🙋🏾",
  "🙋🏿‍♀️",
  "🙋🏿‍♂️",
  "🙋🏿",
  "🙋‍♀️",
  "🙋‍♂️",
  "🙋",
  "🙌🏻",
  "🙌🏼",
  "🙌🏽",
  "🙌🏾",
  "🙌🏿",
  "🙌",
  "🙍🏻‍♀️",
  "🙍🏻‍♂️",
  "🙍🏻",
  "🙍🏼‍♀️",
  "🙍🏼‍♂️",
  "🙍🏼",
  "🙍🏽‍♀️",
  "🙍🏽‍♂️",
  "🙍🏽",
  "🙍🏾‍♀️",
  "🙍🏾‍♂️",
  "🙍🏾",
  "🙍🏿‍♀️",
  "🙍🏿‍♂️",
  "🙍🏿",
  "🙍‍♀️",
  "🙍‍♂️",
  "🙍",
  "🙎🏻‍♀️",
  "🙎🏻‍♂️",
  "🙎🏻",
  "🙎🏼‍♀️",
  "🙎🏼‍♂️",
  "🙎🏼",
  "🙎🏽‍♀️",
  "🙎🏽‍♂️",
  "🙎🏽",
  "🙎🏾‍♀️",
  "🙎🏾‍♂️",
  "🙎🏾",
  "🙎🏿‍♀️",
  "🙎🏿‍♂️",
  "🙎🏿",
  "🙎‍♀️",
  "🙎‍♂️",
  "🙎",
  "🙏🏻",
  "🙏🏼",
  "🙏🏽",
  "🙏🏾",
  "🙏🏿",
  "🙏",
  "🚀",
  "🚁",
  "🚂",
  "🚃",
  "🚄",
  "🚅",
  "🚆",
  "🚇",
  "🚈",
  "🚉",
  "🚊",
  "🚋",
  "🚌",
  "🚍",
  "🚎",
  "🚏",
  "🚐",
  "🚑",
  "🚒",
  "🚓",
  "🚔",
  "🚕",
  "🚖",
  "🚗",
  "🚘",
  "🚙",
  "🚚",
  "🚛",
  "🚜",
  "🚝",
  "🚞",
  "🚟",
  "🚠",
  "🚡",
  "🚢",
  "🚣🏻‍♀️",
  "🚣🏻‍♂️",
  "🚣🏻",
  "🚣🏼‍♀️",
  "🚣🏼‍♂️",
  "🚣🏼",
  "🚣🏽‍♀️",
  "🚣🏽‍♂️",
  "🚣🏽",
  "🚣🏾‍♀️",
  "🚣🏾‍♂️",
  "🚣🏾",
  "🚣🏿‍♀️",
  "🚣🏿‍♂️",
  "🚣🏿",
  "🚣‍♀️",
  "🚣‍♂️",
  "🚣",
  "🚤",
  "🚥",
  "🚦",
  "🚧",
  "🚨",
  "🚩",
  "🚪",
  "🚫",
  "🚬",
  "🚭",
  "🚮",
  "🚯",
  "🚰",
  "🚱",
  "🚲",
  "🚳",
  "🚴🏻‍♀️",
  "🚴🏻‍♂️",
  "🚴🏻",
  "🚴🏼‍♀️",
  "🚴🏼‍♂️",
  "🚴🏼",
  "🚴🏽‍♀️",
  "🚴🏽‍♂️",
  "🚴🏽",
  "🚴🏾‍♀️",
  "🚴🏾‍♂️",
  "🚴🏾",
  "🚴🏿‍♀️",
  "🚴🏿‍♂️",
  "🚴🏿",
  "🚴‍♀️",
  "🚴‍♂️",
  "🚴",
  "🚵🏻‍♀️",
  "🚵🏻‍♂️",
  "🚵🏻",
  "🚵🏼‍♀️",
  "🚵🏼‍♂️",
  "🚵🏼",
  "🚵🏽‍♀️",
  "🚵🏽‍♂️",
  "🚵🏽",
  "🚵🏾‍♀️",
  "🚵🏾‍♂️",
  "🚵🏾",
  "🚵🏿‍♀️",
  "🚵🏿‍♂️",
  "🚵🏿",
  "🚵‍♀️",
  "🚵‍♂️",
  "🚵",
  "🚶🏻‍♀️",
  "🚶🏻‍♂️",
  "🚶🏻",
  "🚶🏼‍♀️",
  "🚶🏼‍♂️",
  "🚶🏼",
  "🚶🏽‍♀️",
  "🚶🏽‍♂️",
  "🚶🏽",
  "🚶🏾‍♀️",
  "🚶🏾‍♂️",
  "🚶🏾",
  "🚶🏿‍♀️",
  "🚶🏿‍♂️",
  "🚶🏿",
  "🚶‍♀️",
  "🚶‍♂️",
  "🚶",
  "🚷",
  "🚸",
  "🚹",
  "🚺",
  "🚻",
  "🚼",
  "🚽",
  "🚾",
  "🚿",
  "🛀🏻",
  "🛀🏼",
  "🛀🏽",
  "🛀🏾",
  "🛀🏿",
  "🛀",
  "🛁",
  "🛂",
  "🛃",
  "🛄",
  "🛅",
  "🛋️",
  "🛌🏻",
  "🛌🏼",
  "🛌🏽",
  "🛌🏾",
  "🛌🏿",
  "🛌",
  "🛍️",
  "🛎️",
  "🛏️",
  "🛐",
  "🛑",
  "🛒",
  "🛕",
  "🛠️",
  "🛡️",
  "🛢️",
  "🛣️",
  "🛤️",
  "🛥️",
  "🛩️",
  "🛫",
  "🛬",
  "🛰️",
  "🛳️",
  "🛴",
  "🛵",
  "🛶",
  "🛷",
  "🛸",
  "🛹",
  "🛺",
  "🟠",
  "🟡",
  "🟢",
  "🟣",
  "🟤",
  "🟥",
  "🟦",
  "🟧",
  "🟨",
  "🟩",
  "🟪",
  "🟫",
  "🤍",
  "🤎",
  "🤏🏻",
  "🤏🏼",
  "🤏🏽",
  "🤏🏾",
  "🤏🏿",
  "🤏",
  "🤐",
  "🤑",
  "🤒",
  "🤓",
  "🤔",
  "🤕",
  "🤖",
  "🤗",
  "🤘🏻",
  "🤘🏼",
  "🤘🏽",
  "🤘🏾",
  "🤘🏿",
  "🤘",
  "🤙🏻",
  "🤙🏼",
  "🤙🏽",
  "🤙🏾",
  "🤙🏿",
  "🤙",
  "🤚🏻",
  "🤚🏼",
  "🤚🏽",
  "🤚🏾",
  "🤚🏿",
  "🤚",
  "🤛🏻",
  "🤛🏼",
  "🤛🏽",
  "🤛🏾",
  "🤛🏿",
  "🤛",
  "🤜🏻",
  "🤜🏼",
  "🤜🏽",
  "🤜🏾",
  "🤜🏿",
  "🤜",
  "🤝",
  "🤞🏻",
  "🤞🏼",
  "🤞🏽",
  "🤞🏾",
  "🤞🏿",
  "🤞",
  "🤟🏻",
  "🤟🏼",
  "🤟🏽",
  "🤟🏾",
  "🤟🏿",
  "🤟",
  "🤠",
  "🤡",
  "🤢",
  "🤣",
  "🤤",
  "🤥",
  "🤦🏻‍♀️",
  "🤦🏻‍♂️",
  "🤦🏻",
  "🤦🏼‍♀️",
  "🤦🏼‍♂️",
  "🤦🏼",
  "🤦🏽‍♀️",
  "🤦🏽‍♂️",
  "🤦🏽",
  "🤦🏾‍♀️",
  "🤦🏾‍♂️",
  "🤦🏾",
  "🤦🏿‍♀️",
  "🤦🏿‍♂️",
  "🤦🏿",
  "🤦‍♀️",
  "🤦‍♂️",
  "🤦",
  "🤧",
  "🤨",
  "🤩",
  "🤪",
  "🤫",
  "🤬",
  "🤭",
  "🤮",
  "🤯",
  "🤰🏻",
  "🤰🏼",
  "🤰🏽",
  "🤰🏾",
  "🤰🏿",
  "🤰",
  "🤱🏻",
  "🤱🏼",
  "🤱🏽",
  "🤱🏾",
  "🤱🏿",
  "🤱",
  "🤲🏻",
  "🤲🏼",
  "🤲🏽",
  "🤲🏾",
  "🤲🏿",
  "🤲",
  "🤳🏻",
  "🤳🏼",
  "🤳🏽",
  "🤳🏾",
  "🤳🏿",
  "🤳",
  "🤴🏻",
  "🤴🏼",
  "🤴🏽",
  "🤴🏾",
  "🤴🏿",
  "🤴",
  "🤵🏻‍♀️",
  "🤵🏻‍♂️",
  "🤵🏻",
  "🤵🏼‍♀️",
  "🤵🏼‍♂️",
  "🤵🏼",
  "🤵🏽‍♀️",
  "🤵🏽‍♂️",
  "🤵🏽",
  "🤵🏾‍♀️",
  "🤵🏾‍♂️",
  "🤵🏾",
  "🤵🏿‍♀️",
  "🤵🏿‍♂️",
  "🤵🏿",
  "🤵‍♀️",
  "🤵‍♂️",
  "🤵",
  "🤶🏻",
  "🤶🏼",
  "🤶🏽",
  "🤶🏾",
  "🤶🏿",
  "🤶",
  "🤷🏻‍♀️",
  "🤷🏻‍♂️",
  "🤷🏻",
  "🤷🏼‍♀️",
  "🤷🏼‍♂️",
  "🤷🏼",
  "🤷🏽‍♀️",
  "🤷🏽‍♂️",
  "🤷🏽",
  "🤷🏾‍♀️",
  "🤷🏾‍♂️",
  "🤷🏾",
  "🤷🏿‍♀️",
  "🤷🏿‍♂️",
  "🤷🏿",
  "🤷‍♀️",
  "🤷‍♂️",
  "🤷",
  "🤸🏻‍♀️",
  "🤸🏻‍♂️",
  "🤸🏻",
  "🤸🏼‍♀️",
  "🤸🏼‍♂️",
  "🤸🏼",
  "🤸🏽‍♀️",
  "🤸🏽‍♂️",
  "🤸🏽",
  "🤸🏾‍♀️",
  "🤸🏾‍♂️",
  "🤸🏾",
  "🤸🏿‍♀️",
  "🤸🏿‍♂️",
  "🤸🏿",
  "🤸‍♀️",
  "🤸‍♂️",
  "🤸",
  "🤹🏻‍♀️",
  "🤹🏻‍♂️",
  "🤹🏻",
  "🤹🏼‍♀️",
  "🤹🏼‍♂️",
  "🤹🏼",
  "🤹🏽‍♀️",
  "🤹🏽‍♂️",
  "🤹🏽",
  "🤹🏾‍♀️",
  "🤹🏾‍♂️",
  "🤹🏾",
  "🤹🏿‍♀️",
  "🤹🏿‍♂️",
  "🤹🏿",
  "🤹‍♀️",
  "🤹‍♂️",
  "🤹",
  "🤺",
  "🤼‍♀️",
  "🤼‍♂️",
  "🤼",
  "🤽🏻‍♀️",
  "🤽🏻‍♂️",
  "🤽🏻",
  "🤽🏼‍♀️",
  "🤽🏼‍♂️",
  "🤽🏼",
  "🤽🏽‍♀️",
  "🤽🏽‍♂️",
  "🤽🏽",
  "🤽🏾‍♀️",
  "🤽🏾‍♂️",
  "🤽🏾",
  "🤽🏿‍♀️",
  "🤽🏿‍♂️",
  "🤽🏿",
  "🤽‍♀️",
  "🤽‍♂️",
  "🤽",
  "🤾🏻‍♀️",
  "🤾🏻‍♂️",
  "🤾🏻",
  "🤾🏼‍♀️",
  "🤾🏼‍♂️",
  "🤾🏼",
  "🤾🏽‍♀️",
  "🤾🏽‍♂️",
  "🤾🏽",
  "🤾🏾‍♀️",
  "🤾🏾‍♂️",
  "🤾🏾",
  "🤾🏿‍♀️",
  "🤾🏿‍♂️",
  "🤾🏿",
  "🤾‍♀️",
  "🤾‍♂️",
  "🤾",
  "🤿",
  "🥀",
  "🥁",
  "🥂",
  "🥃",
  "🥄",
  "🥅",
  "🥇",
  "🥈",
  "🥉",
  "🥊",
  "🥋",
  "🥌",
  "🥍",
  "🥎",
  "🥏",
  "🥐",
  "🥑",
  "🥒",
  "🥓",
  "🥔",
  "🥕",
  "🥖",
  "🥗",
  "🥘",
  "🥙",
  "🥚",
  "🥛",
  "🥜",
  "🥝",
  "🥞",
  "🥟",
  "🥠",
  "🥡",
  "🥢",
  "🥣",
  "🥤",
  "🥥",
  "🥦",
  "🥧",
  "🥨",
  "🥩",
  "🥪",
  "🥫",
  "🥬",
  "🥭",
  "🥮",
  "🥯",
  "🥰",
  "🥱",
  "🥳",
  "🥴",
  "🥵",
  "🥶",
  "🥺",
  "🥻",
  "🥼",
  "🥽",
  "🥾",
  "🥿",
  "🦀",
  "🦁",
  "🦂",
  "🦃",
  "🦄",
  "🦅",
  "🦆",
  "🦇",
  "🦈",
  "🦉",
  "🦊",
  "🦋",
  "🦌",
  "🦍",
  "🦎",
  "🦏",
  "🦐",
  "🦑",
  "🦒",
  "🦓",
  "🦔",
  "🦕",
  "🦖",
  "🦗",
  "🦘",
  "🦙",
  "🦚",
  "🦛",
  "🦜",
  "🦝",
  "🦞",
  "🦟",
  "🦠",
  "🦡",
  "🦢",
  "🦥",
  "🦦",
  "🦧",
  "🦨",
  "🦩",
  "🦪",
  "🦮",
  "🦯",
  "🦰",
  "🦱",
  "🦲",
  "🦳",
  "🦴",
  "🦵🏻",
  "🦵🏼",
  "🦵🏽",
  "🦵🏾",
  "🦵🏿",
  "🦵",
  "🦶🏻",
  "🦶🏼",
  "🦶🏽",
  "🦶🏾",
  "🦶🏿",
  "🦶",
  "🦷",
  "🦸🏻‍♀️",
  "🦸🏻‍♂️",
  "🦸🏻",
  "🦸🏼‍♀️",
  "🦸🏼‍♂️",
  "🦸🏼",
  "🦸🏽‍♀️",
  "🦸🏽‍♂️",
  "🦸🏽",
  "🦸🏾‍♀️",
  "🦸🏾‍♂️",
  "🦸🏾",
  "🦸🏿‍♀️",
  "🦸🏿‍♂️",
  "🦸🏿",
  "🦸‍♀️",
  "🦸‍♂️",
  "🦸",
  "🦹🏻‍♀️",
  "🦹🏻‍♂️",
  "🦹🏻",
  "🦹🏼‍♀️",
  "🦹🏼‍♂️",
  "🦹🏼",
  "🦹🏽‍♀️",
  "🦹🏽‍♂️",
  "🦹🏽",
  "🦹🏾‍♀️",
  "🦹🏾‍♂️",
  "🦹🏾",
  "🦹🏿‍♀️",
  "🦹🏿‍♂️",
  "🦹🏿",
  "🦹‍♀️",
  "🦹‍♂️",
  "🦹",
  "🦺",
  "🦻🏻",
  "🦻🏼",
  "🦻🏽",
  "🦻🏾",
  "🦻🏿",
  "🦻",
  "🦼",
  "🦽",
  "🦾",
  "🦿",
  "🧀",
  "🧁",
  "🧂",
  "🧃",
  "🧄",
  "🧅",
  "🧆",
  "🧇",
  "🧈",
  "🧉",
  "🧊",
  "🧍🏻‍♀️",
  "🧍🏻‍♂️",
  "🧍🏻",
  "🧍🏼‍♀️",
  "🧍🏼‍♂️",
  "🧍🏼",
  "🧍🏽‍♀️",
  "🧍🏽‍♂️",
  "🧍🏽",
  "🧍🏾‍♀️",
  "🧍🏾‍♂️",
  "🧍🏾",
  "🧍🏿‍♀️",
  "🧍🏿‍♂️",
  "🧍🏿",
  "🧍‍♀️",
  "🧍‍♂️",
  "🧍",
  "🧎🏻‍♀️",
  "🧎🏻‍♂️",
  "🧎🏻",
  "🧎🏼‍♀️",
  "🧎🏼‍♂️",
  "🧎🏼",
  "🧎🏽‍♀️",
  "🧎🏽‍♂️",
  "🧎🏽",
  "🧎🏾‍♀️",
  "🧎🏾‍♂️",
  "🧎🏾",
  "🧎🏿‍♀️",
  "🧎🏿‍♂️",
  "🧎🏿",
  "🧎‍♀️",
  "🧎‍♂️",
  "🧎",
  "🧏🏻‍♀️",
  "🧏🏻‍♂️",
  "🧏🏻",
  "🧏🏼‍♀️",
  "🧏🏼‍♂️",
  "🧏🏼",
  "🧏🏽‍♀️",
  "🧏🏽‍♂️",
  "🧏🏽",
  "🧏🏾‍♀️",
  "🧏🏾‍♂️",
  "🧏🏾",
  "🧏🏿‍♀️",
  "🧏🏿‍♂️",
  "🧏🏿",
  "🧏‍♀️",
  "🧏‍♂️",
  "🧏",
  "🧐",
  "🧑🏻‍🤝‍🧑🏻",
  "🧑🏻",
  "🧑🏼‍🤝‍🧑🏻",
  "🧑🏼‍🤝‍🧑🏼",
  "🧑🏼",
  "🧑🏽‍🤝‍🧑🏻",
  "🧑🏽‍🤝‍🧑🏼",
  "🧑🏽‍🤝‍🧑🏽",
  "🧑🏽",
  "🧑🏾‍🤝‍🧑🏻",
  "🧑🏾‍🤝‍🧑🏼",
  "🧑🏾‍🤝‍🧑🏽",
  "🧑🏾‍🤝‍🧑🏾",
  "🧑🏾",
  "🧑🏿‍🤝‍🧑🏻",
  "🧑🏿‍🤝‍🧑🏼",
  "🧑🏿‍🤝‍🧑🏽",
  "🧑🏿‍🤝‍🧑🏾",
  "🧑🏿‍🤝‍🧑🏿",
  "🧑🏿",
  "🧑‍🤝‍🧑",
  "🧑",
  "🧒🏻",
  "🧒🏼",
  "🧒🏽",
  "🧒🏾",
  "🧒🏿",
  "🧒",
  "🧓🏻",
  "🧓🏼",
  "🧓🏽",
  "🧓🏾",
  "🧓🏿",
  "🧓",
  "🧔🏻",
  "🧔🏼",
  "🧔🏽",
  "🧔🏾",
  "🧔🏿",
  "🧔",
  "🧕🏻",
  "🧕🏼",
  "🧕🏽",
  "🧕🏾",
  "🧕🏿",
  "🧕",
  "🧖🏻‍♀️",
  "🧖🏻‍♂️",
  "🧖🏻",
  "🧖🏼‍♀️",
  "🧖🏼‍♂️",
  "🧖🏼",
  "🧖🏽‍♀️",
  "🧖🏽‍♂️",
  "🧖🏽",
  "🧖🏾‍♀️",
  "🧖🏾‍♂️",
  "🧖🏾",
  "🧖🏿‍♀️",
  "🧖🏿‍♂️",
  "🧖🏿",
  "🧖‍♀️",
  "🧖‍♂️",
  "🧖",
  "🧗🏻‍♀️",
  "🧗🏻‍♂️",
  "🧗🏻",
  "🧗🏼‍♀️",
  "🧗🏼‍♂️",
  "🧗🏼",
  "🧗🏽‍♀️",
  "🧗🏽‍♂️",
  "🧗🏽",
  "🧗🏾‍♀️",
  "🧗🏾‍♂️",
  "🧗🏾",
  "🧗🏿‍♀️",
  "🧗🏿‍♂️",
  "🧗🏿",
  "🧗‍♀️",
  "🧗‍♂️",
  "🧗",
  "🧘🏻‍♀️",
  "🧘🏻‍♂️",
  "🧘🏻",
  "🧘🏼‍♀️",
  "🧘🏼‍♂️",
  "🧘🏼",
  "🧘🏽‍♀️",
  "🧘🏽‍♂️",
  "🧘🏽",
  "🧘🏾‍♀️",
  "🧘🏾‍♂️",
  "🧘🏾",
  "🧘🏿‍♀️",
  "🧘🏿‍♂️",
  "🧘🏿",
  "🧘‍♀️",
  "🧘‍♂️",
  "🧘",
  "🧙🏻‍♀️",
  "🧙🏻‍♂️",
  "🧙🏻",
  "🧙🏼‍♀️",
  "🧙🏼‍♂️",
  "🧙🏼",
  "🧙🏽‍♀️",
  "🧙🏽‍♂️",
  "🧙🏽",
  "🧙🏾‍♀️",
  "🧙🏾‍♂️",
  "🧙🏾",
  "🧙🏿‍♀️",
  "🧙🏿‍♂️",
  "🧙🏿",
  "🧙‍♀️",
  "🧙‍♂️",
  "🧙",
  "🧚🏻‍♀️",
  "🧚🏻‍♂️",
  "🧚🏻",
  "🧚🏼‍♀️",
  "🧚🏼‍♂️",
  "🧚🏼",
  "🧚🏽‍♀️",
  "🧚🏽‍♂️",
  "🧚🏽",
  "🧚🏾‍♀️",
  "🧚🏾‍♂️",
  "🧚🏾",
  "🧚🏿‍♀️",
  "🧚🏿‍♂️",
  "🧚🏿",
  "🧚‍♀️",
  "🧚‍♂️",
  "🧚",
  "🧛🏻‍♀️",
  "🧛🏻‍♂️",
  "🧛🏻",
  "🧛🏼‍♀️",
  "🧛🏼‍♂️",
  "🧛🏼",
  "🧛🏽‍♀️",
  "🧛🏽‍♂️",
  "🧛🏽",
  "🧛🏾‍♀️",
  "🧛🏾‍♂️",
  "🧛🏾",
  "🧛🏿‍♀️",
  "🧛🏿‍♂️",
  "🧛🏿",
  "🧛‍♀️",
  "🧛‍♂️",
  "🧛",
  "🧜🏻‍♀️",
  "🧜🏻‍♂️",
  "🧜🏻",
  "🧜🏼‍♀️",
  "🧜🏼‍♂️",
  "🧜🏼",
  "🧜🏽‍♀️",
  "🧜🏽‍♂️",
  "🧜🏽",
  "🧜🏾‍♀️",
  "🧜🏾‍♂️",
  "🧜🏾",
  "🧜🏿‍♀️",
  "🧜🏿‍♂️",
  "🧜🏿",
  "🧜‍♀️",
  "🧜‍♂️",
  "🧜",
  "🧝🏻‍♀️",
  "🧝🏻‍♂️",
  "🧝🏻",
  "🧝🏼‍♀️",
  "🧝🏼‍♂️",
  "🧝🏼",
  "🧝🏽‍♀️",
  "🧝🏽‍♂️",
  "🧝🏽",
  "🧝🏾‍♀️",
  "🧝🏾‍♂️",
  "🧝🏾",
  "🧝🏿‍♀️",
  "🧝🏿‍♂️",
  "🧝🏿",
  "🧝‍♀️",
  "🧝‍♂️",
  "🧝",
  "🧞‍♀️",
  "🧞‍♂️",
  "🧞",
  "🧟‍♀️",
  "🧟‍♂️",
  "🧟",
  "🧠",
  "🧡",
  "🧢",
  "🧣",
  "🧤",
  "🧥",
  "🧦",
  "🧧",
  "🧨",
  "🧩",
  "🧪",
  "🧫",
  "🧬",
  "🧭",
  "🧮",
  "🧯",
  "🧰",
  "🧱",
  "🧲",
  "🧳",
  "🧴",
  "🧵",
  "🧶",
  "🧷",
  "🧸",
  "🧹",
  "🧺",
  "🧻",
  "🧼",
  "🧽",
  "🧾",
  "🧿",
  "🩰",
  "🩱",
  "🩲",
  "🩳",
  "🩸",
  "🩹",
  "🩺",
  "🪀",
  "🪁",
  "🪂",
  "🪐",
  "🪑",
  "🪒",
  "🪓",
  "🪔",
  "🪕",
  "‼️",
  "⁉️",
  "™️",
  "ℹ️",
  "↔️",
  "↕️",
  "↖️",
  "↗️",
  "↘️",
  "↙️",
  "↩️",
  "↪️",
  "#⃣",
  "⌚️",
  "⌛️",
  "⌨️",
  "⏏️",
  "⏩",
  "⏪",
  "⏫",
  "⏬",
  "⏭️",
  "⏮️",
  "⏯️",
  "⏰",
  "⏱️",
  "⏲️",
  "⏳",
  "⏸️",
  "⏹️",
  "⏺️",
  "Ⓜ️",
  "▪️",
  "▫️",
  "▶️",
  "◀️",
  "◻️",
  "◼️",
  "◽️",
  "◾️",
  "☀️",
  "☁️",
  "☂️",
  "☃️",
  "☄️",
  "☎️",
  "☑️",
  "☔️",
  "☕️",
  "☘️",
  "☝🏻",
  "☝🏼",
  "☝🏽",
  "☝🏾",
  "☝🏿",
  "☝️",
  "☠️",
  "☢️",
  "☣️",
  "☦️",
  "☪️",
  "☮️",
  "☯️",
  "☸️",
  "☹️",
  "☺️",
  "♀️",
  "♂️",
  "♈️",
  "♉️",
  "♊️",
  "♋️",
  "♌️",
  "♍️",
  "♎️",
  "♏️",
  "♐️",
  "♑️",
  "♒️",
  "♓️",
  "♟️",
  "♠️",
  "♣️",
  "♥️",
  "♦️",
  "♨️",
  "♻️",
  "♾",
  "♿️",
  "⚒️",
  "⚓️",
  "⚔️",
  "⚕️",
  "⚖️",
  "⚗️",
  "⚙️",
  "⚛️",
  "⚜️",
  "⚠️",
  "⚡️",
  "⚪️",
  "⚫️",
  "⚰️",
  "⚱️",
  "⚽️",
  "⚾️",
  "⛄️",
  "⛅️",
  "⛈️",
  "⛎",
  "⛏️",
  "⛑️",
  "⛓️",
  "⛔️",
  "⛩️",
  "⛪️",
  "⛰️",
  "⛱️",
  "⛲️",
  "⛳️",
  "⛴️",
  "⛵️",
  "⛷🏻",
  "⛷🏼",
  "⛷🏽",
  "⛷🏾",
  "⛷🏿",
  "⛷️",
  "⛸️",
  "⛹🏻‍♀️",
  "⛹🏻‍♂️",
  "⛹🏻",
  "⛹🏼‍♀️",
  "⛹🏼‍♂️",
  "⛹🏼",
  "⛹🏽‍♀️",
  "⛹🏽‍♂️",
  "⛹🏽",
  "⛹🏾‍♀️",
  "⛹🏾‍♂️",
  "⛹🏾",
  "⛹🏿‍♀️",
  "⛹🏿‍♂️",
  "⛹🏿",
  "⛹️‍♀️",
  "⛹️‍♂️",
  "⛹️",
  "⛺️",
  "⛽️",
  "✂️",
  "✅",
  "✈️",
  "✉️",
  "✊🏻",
  "✊🏼",
  "✊🏽",
  "✊🏾",
  "✊🏿",
  "✊",
  "✋🏻",
  "✋🏼",
  "✋🏽",
  "✋🏾",
  "✋🏿",
  "✋",
  "✌🏻",
  "✌🏼",
  "✌🏽",
  "✌🏾",
  "✌🏿",
  "✌️",
  "✍🏻",
  "✍🏼",
  "✍🏽",
  "✍🏾",
  "✍🏿",
  "✍️",
  "✏️",
  "✒️",
  "✔️",
  "✖️",
  "✝️",
  "✡️",
  "✨",
  "✳️",
  "✴️",
  "❄️",
  "❇️",
  "❌",
  "❎",
  "❓",
  "❔",
  "❕",
  "❗️",
  "❣️",
  "❤️",
  "➕",
  "➖",
  "➗",
  "➡️",
  "➰",
  "➿",
  "⤴️",
  "⤵️",
  "*⃣",
  "⬅️",
  "⬆️",
  "⬇️",
  "⬛️",
  "⬜️",
  "⭐️",
  "⭕️",
  "0⃣",
  "〰️",
  "〽️",
  "1⃣",
  "2⃣",
  "㊗️",
  "㊙️",
  "3⃣",
  "4⃣",
  "5⃣",
  "6⃣",
  "7⃣",
  "8⃣",
  "9⃣",
  "©️",
  "®️",
  ""
]

/***/ }),

/***/ 8206:
/***/ ((module) => {

"use strict";


// do not edit .js files directly - edit src/index.jst



module.exports = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;

    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }



    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];

      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a!==a && b!==b;
};


/***/ }),

/***/ 969:
/***/ ((module) => {

"use strict";


module.exports = function (data, opts) {
    if (!opts) opts = {};
    if (typeof opts === 'function') opts = { cmp: opts };
    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

    var cmp = opts.cmp && (function (f) {
        return function (node) {
            return function (a, b) {
                var aobj = { key: a, value: node[a] };
                var bobj = { key: b, value: node[b] };
                return f(aobj, bobj);
            };
        };
    })(opts.cmp);

    var seen = [];
    return (function stringify (node) {
        if (node && node.toJSON && typeof node.toJSON === 'function') {
            node = node.toJSON();
        }

        if (node === undefined) return;
        if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
        if (typeof node !== 'object') return JSON.stringify(node);

        var i, out;
        if (Array.isArray(node)) {
            out = '[';
            for (i = 0; i < node.length; i++) {
                if (i) out += ',';
                out += stringify(node[i]) || 'null';
            }
            return out + ']';
        }

        if (node === null) return 'null';

        if (seen.indexOf(node) !== -1) {
            if (cycles) return JSON.stringify('__cycle__');
            throw new TypeError('Converting circular structure to JSON');
        }

        var seenIndex = seen.push(node) - 1;
        var keys = Object.keys(node).sort(cmp && cmp(node));
        out = '';
        for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = stringify(node[key]);

            if (!value) continue;
            if (out) out += ',';
            out += JSON.stringify(key) + ':' + value;
        }
        seen.splice(seenIndex, 1);
        return '{' + out + '}';
    })(data);
};


/***/ }),

/***/ 6863:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = realpath
realpath.realpath = realpath
realpath.sync = realpathSync
realpath.realpathSync = realpathSync
realpath.monkeypatch = monkeypatch
realpath.unmonkeypatch = unmonkeypatch

var fs = __webpack_require__(5747)
var origRealpath = fs.realpath
var origRealpathSync = fs.realpathSync

var version = process.version
var ok = /^v[0-5]\./.test(version)
var old = __webpack_require__(1734)

function newError (er) {
  return er && er.syscall === 'realpath' && (
    er.code === 'ELOOP' ||
    er.code === 'ENOMEM' ||
    er.code === 'ENAMETOOLONG'
  )
}

function realpath (p, cache, cb) {
  if (ok) {
    return origRealpath(p, cache, cb)
  }

  if (typeof cache === 'function') {
    cb = cache
    cache = null
  }
  origRealpath(p, cache, function (er, result) {
    if (newError(er)) {
      old.realpath(p, cache, cb)
    } else {
      cb(er, result)
    }
  })
}

function realpathSync (p, cache) {
  if (ok) {
    return origRealpathSync(p, cache)
  }

  try {
    return origRealpathSync(p, cache)
  } catch (er) {
    if (newError(er)) {
      return old.realpathSync(p, cache)
    } else {
      throw er
    }
  }
}

function monkeypatch () {
  fs.realpath = realpath
  fs.realpathSync = realpathSync
}

function unmonkeypatch () {
  fs.realpath = origRealpath
  fs.realpathSync = origRealpathSync
}


/***/ }),

/***/ 1734:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var pathModule = __webpack_require__(5622);
var isWindows = process.platform === 'win32';
var fs = __webpack_require__(5747);

// JavaScript implementation of realpath, ported from node pre-v6

var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);

function rethrow() {
  // Only enable in debug mode. A backtrace uses ~1000 bytes of heap space and
  // is fairly slow to generate.
  var callback;
  if (DEBUG) {
    var backtrace = new Error;
    callback = debugCallback;
  } else
    callback = missingCallback;

  return callback;

  function debugCallback(err) {
    if (err) {
      backtrace.message = err.message;
      err = backtrace;
      missingCallback(err);
    }
  }

  function missingCallback(err) {
    if (err) {
      if (process.throwDeprecation)
        throw err;  // Forgot a callback but don't know where? Use NODE_DEBUG=fs
      else if (!process.noDeprecation) {
        var msg = 'fs: missing callback ' + (err.stack || err.message);
        if (process.traceDeprecation)
          console.trace(msg);
        else
          console.error(msg);
      }
    }
  }
}

function maybeCallback(cb) {
  return typeof cb === 'function' ? cb : rethrow();
}

var normalize = pathModule.normalize;

// Regexp that finds the next partion of a (partial) path
// result is [base_with_slash, base], e.g. ['somedir/', 'somedir']
if (isWindows) {
  var nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
} else {
  var nextPartRe = /(.*?)(?:[\/]+|$)/g;
}

// Regex to find the device root, including trailing slash. E.g. 'c:\\'.
if (isWindows) {
  var splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
} else {
  var splitRootRe = /^[\/]*/;
}

exports.realpathSync = function realpathSync(p, cache) {
  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return cache[p];
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows && !knownHard[base]) {
      fs.lstatSync(base);
      knownHard[base] = true;
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  // NB: p.length changes.
  while (pos < p.length) {
    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      continue;
    }

    var resolvedLink;
    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // some known symbolic link.  no need to stat again.
      resolvedLink = cache[base];
    } else {
      var stat = fs.lstatSync(base);
      if (!stat.isSymbolicLink()) {
        knownHard[base] = true;
        if (cache) cache[base] = base;
        continue;
      }

      // read the link if it wasn't read before
      // dev/ino always return 0 on windows, so skip the check.
      var linkTarget = null;
      if (!isWindows) {
        var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
        if (seenLinks.hasOwnProperty(id)) {
          linkTarget = seenLinks[id];
        }
      }
      if (linkTarget === null) {
        fs.statSync(base);
        linkTarget = fs.readlinkSync(base);
      }
      resolvedLink = pathModule.resolve(previous, linkTarget);
      // track this, if given a cache.
      if (cache) cache[base] = resolvedLink;
      if (!isWindows) seenLinks[id] = linkTarget;
    }

    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }

  if (cache) cache[original] = p;

  return p;
};


exports.realpath = function realpath(p, cache, cb) {
  if (typeof cb !== 'function') {
    cb = maybeCallback(cache);
    cache = null;
  }

  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return process.nextTick(cb.bind(null, null, cache[p]));
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows && !knownHard[base]) {
      fs.lstat(base, function(err) {
        if (err) return cb(err);
        knownHard[base] = true;
        LOOP();
      });
    } else {
      process.nextTick(LOOP);
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  function LOOP() {
    // stop if scanned past end of path
    if (pos >= p.length) {
      if (cache) cache[original] = p;
      return cb(null, p);
    }

    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      return process.nextTick(LOOP);
    }

    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // known symbolic link.  no need to stat again.
      return gotResolvedLink(cache[base]);
    }

    return fs.lstat(base, gotStat);
  }

  function gotStat(err, stat) {
    if (err) return cb(err);

    // if not a symlink, skip to the next path part
    if (!stat.isSymbolicLink()) {
      knownHard[base] = true;
      if (cache) cache[base] = base;
      return process.nextTick(LOOP);
    }

    // stat & read the link if not read before
    // call gotTarget as soon as the link target is known
    // dev/ino always return 0 on windows, so skip the check.
    if (!isWindows) {
      var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
      if (seenLinks.hasOwnProperty(id)) {
        return gotTarget(null, seenLinks[id], base);
      }
    }
    fs.stat(base, function(err) {
      if (err) return cb(err);

      fs.readlink(base, function(err, target) {
        if (!isWindows) seenLinks[id] = target;
        gotTarget(err, target);
      });
    });
  }

  function gotTarget(err, target, base) {
    if (err) return cb(err);

    var resolvedLink = pathModule.resolve(previous, target);
    if (cache) cache[base] = resolvedLink;
    gotResolvedLink(resolvedLink);
  }

  function gotResolvedLink(resolvedLink) {
    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }
};


/***/ }),

/***/ 7625:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

exports.alphasort = alphasort
exports.alphasorti = alphasorti
exports.setopts = setopts
exports.ownProp = ownProp
exports.makeAbs = makeAbs
exports.finish = finish
exports.mark = mark
exports.isIgnored = isIgnored
exports.childrenIgnored = childrenIgnored

function ownProp (obj, field) {
  return Object.prototype.hasOwnProperty.call(obj, field)
}

var path = __webpack_require__(5622)
var minimatch = __webpack_require__(3973)
var isAbsolute = __webpack_require__(8714)
var Minimatch = minimatch.Minimatch

function alphasorti (a, b) {
  return a.toLowerCase().localeCompare(b.toLowerCase())
}

function alphasort (a, b) {
  return a.localeCompare(b)
}

function setupIgnores (self, options) {
  self.ignore = options.ignore || []

  if (!Array.isArray(self.ignore))
    self.ignore = [self.ignore]

  if (self.ignore.length) {
    self.ignore = self.ignore.map(ignoreMap)
  }
}

// ignore patterns are always in dot:true mode.
function ignoreMap (pattern) {
  var gmatcher = null
  if (pattern.slice(-3) === '/**') {
    var gpattern = pattern.replace(/(\/\*\*)+$/, '')
    gmatcher = new Minimatch(gpattern, { dot: true })
  }

  return {
    matcher: new Minimatch(pattern, { dot: true }),
    gmatcher: gmatcher
  }
}

function setopts (self, pattern, options) {
  if (!options)
    options = {}

  // base-matching: just use globstar for that.
  if (options.matchBase && -1 === pattern.indexOf("/")) {
    if (options.noglobstar) {
      throw new Error("base matching requires globstar")
    }
    pattern = "**/" + pattern
  }

  self.silent = !!options.silent
  self.pattern = pattern
  self.strict = options.strict !== false
  self.realpath = !!options.realpath
  self.realpathCache = options.realpathCache || Object.create(null)
  self.follow = !!options.follow
  self.dot = !!options.dot
  self.mark = !!options.mark
  self.nodir = !!options.nodir
  if (self.nodir)
    self.mark = true
  self.sync = !!options.sync
  self.nounique = !!options.nounique
  self.nonull = !!options.nonull
  self.nosort = !!options.nosort
  self.nocase = !!options.nocase
  self.stat = !!options.stat
  self.noprocess = !!options.noprocess
  self.absolute = !!options.absolute

  self.maxLength = options.maxLength || Infinity
  self.cache = options.cache || Object.create(null)
  self.statCache = options.statCache || Object.create(null)
  self.symlinks = options.symlinks || Object.create(null)

  setupIgnores(self, options)

  self.changedCwd = false
  var cwd = process.cwd()
  if (!ownProp(options, "cwd"))
    self.cwd = cwd
  else {
    self.cwd = path.resolve(options.cwd)
    self.changedCwd = self.cwd !== cwd
  }

  self.root = options.root || path.resolve(self.cwd, "/")
  self.root = path.resolve(self.root)
  if (process.platform === "win32")
    self.root = self.root.replace(/\\/g, "/")

  // TODO: is an absolute `cwd` supposed to be resolved against `root`?
  // e.g. { cwd: '/test', root: __dirname } === path.join(__dirname, '/test')
  self.cwdAbs = isAbsolute(self.cwd) ? self.cwd : makeAbs(self, self.cwd)
  if (process.platform === "win32")
    self.cwdAbs = self.cwdAbs.replace(/\\/g, "/")
  self.nomount = !!options.nomount

  // disable comments and negation in Minimatch.
  // Note that they are not supported in Glob itself anyway.
  options.nonegate = true
  options.nocomment = true

  self.minimatch = new Minimatch(pattern, options)
  self.options = self.minimatch.options
}

function finish (self) {
  var nou = self.nounique
  var all = nou ? [] : Object.create(null)

  for (var i = 0, l = self.matches.length; i < l; i ++) {
    var matches = self.matches[i]
    if (!matches || Object.keys(matches).length === 0) {
      if (self.nonull) {
        // do like the shell, and spit out the literal glob
        var literal = self.minimatch.globSet[i]
        if (nou)
          all.push(literal)
        else
          all[literal] = true
      }
    } else {
      // had matches
      var m = Object.keys(matches)
      if (nou)
        all.push.apply(all, m)
      else
        m.forEach(function (m) {
          all[m] = true
        })
    }
  }

  if (!nou)
    all = Object.keys(all)

  if (!self.nosort)
    all = all.sort(self.nocase ? alphasorti : alphasort)

  // at *some* point we statted all of these
  if (self.mark) {
    for (var i = 0; i < all.length; i++) {
      all[i] = self._mark(all[i])
    }
    if (self.nodir) {
      all = all.filter(function (e) {
        var notDir = !(/\/$/.test(e))
        var c = self.cache[e] || self.cache[makeAbs(self, e)]
        if (notDir && c)
          notDir = c !== 'DIR' && !Array.isArray(c)
        return notDir
      })
    }
  }

  if (self.ignore.length)
    all = all.filter(function(m) {
      return !isIgnored(self, m)
    })

  self.found = all
}

function mark (self, p) {
  var abs = makeAbs(self, p)
  var c = self.cache[abs]
  var m = p
  if (c) {
    var isDir = c === 'DIR' || Array.isArray(c)
    var slash = p.slice(-1) === '/'

    if (isDir && !slash)
      m += '/'
    else if (!isDir && slash)
      m = m.slice(0, -1)

    if (m !== p) {
      var mabs = makeAbs(self, m)
      self.statCache[mabs] = self.statCache[abs]
      self.cache[mabs] = self.cache[abs]
    }
  }

  return m
}

// lotta situps...
function makeAbs (self, f) {
  var abs = f
  if (f.charAt(0) === '/') {
    abs = path.join(self.root, f)
  } else if (isAbsolute(f) || f === '') {
    abs = f
  } else if (self.changedCwd) {
    abs = path.resolve(self.cwd, f)
  } else {
    abs = path.resolve(f)
  }

  if (process.platform === 'win32')
    abs = abs.replace(/\\/g, '/')

  return abs
}


// Return true, if pattern ends with globstar '**', for the accompanying parent directory.
// Ex:- If node_modules/** is the pattern, add 'node_modules' to ignore list along with it's contents
function isIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return item.matcher.match(path) || !!(item.gmatcher && item.gmatcher.match(path))
  })
}

function childrenIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return !!(item.gmatcher && item.gmatcher.match(path))
  })
}


/***/ }),

/***/ 1957:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// Approach:
//
// 1. Get the minimatch set
// 2. For each pattern in the set, PROCESS(pattern, false)
// 3. Store matches per-set, then uniq them
//
// PROCESS(pattern, inGlobStar)
// Get the first [n] items from pattern that are all strings
// Join these together.  This is PREFIX.
//   If there is no more remaining, then stat(PREFIX) and
//   add to matches if it succeeds.  END.
//
// If inGlobStar and PREFIX is symlink and points to dir
//   set ENTRIES = []
// else readdir(PREFIX) as ENTRIES
//   If fail, END
//
// with ENTRIES
//   If pattern[n] is GLOBSTAR
//     // handle the case where the globstar match is empty
//     // by pruning it out, and testing the resulting pattern
//     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
//     // handle other cases.
//     for ENTRY in ENTRIES (not dotfiles)
//       // attach globstar + tail onto the entry
//       // Mark that this entry is a globstar match
//       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
//
//   else // not globstar
//     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
//       Test ENTRY against pattern[n]
//       If fails, continue
//       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
//
// Caveat:
//   Cache all stats and readdirs results to minimize syscall.  Since all
//   we ever care about is existence and directory-ness, we can just keep
//   `true` for files, and [children,...] for directories, or `false` for
//   things that don't exist.

module.exports = glob

var fs = __webpack_require__(5747)
var rp = __webpack_require__(6863)
var minimatch = __webpack_require__(3973)
var Minimatch = minimatch.Minimatch
var inherits = __webpack_require__(4124)
var EE = __webpack_require__(8614).EventEmitter
var path = __webpack_require__(5622)
var assert = __webpack_require__(2357)
var isAbsolute = __webpack_require__(8714)
var globSync = __webpack_require__(9010)
var common = __webpack_require__(7625)
var alphasort = common.alphasort
var alphasorti = common.alphasorti
var setopts = common.setopts
var ownProp = common.ownProp
var inflight = __webpack_require__(2492)
var util = __webpack_require__(1669)
var childrenIgnored = common.childrenIgnored
var isIgnored = common.isIgnored

var once = __webpack_require__(1223)

function glob (pattern, options, cb) {
  if (typeof options === 'function') cb = options, options = {}
  if (!options) options = {}

  if (options.sync) {
    if (cb)
      throw new TypeError('callback provided to sync glob')
    return globSync(pattern, options)
  }

  return new Glob(pattern, options, cb)
}

glob.sync = globSync
var GlobSync = glob.GlobSync = globSync.GlobSync

// old api surface
glob.glob = glob

function extend (origin, add) {
  if (add === null || typeof add !== 'object') {
    return origin
  }

  var keys = Object.keys(add)
  var i = keys.length
  while (i--) {
    origin[keys[i]] = add[keys[i]]
  }
  return origin
}

glob.hasMagic = function (pattern, options_) {
  var options = extend({}, options_)
  options.noprocess = true

  var g = new Glob(pattern, options)
  var set = g.minimatch.set

  if (!pattern)
    return false

  if (set.length > 1)
    return true

  for (var j = 0; j < set[0].length; j++) {
    if (typeof set[0][j] !== 'string')
      return true
  }

  return false
}

glob.Glob = Glob
inherits(Glob, EE)
function Glob (pattern, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = null
  }

  if (options && options.sync) {
    if (cb)
      throw new TypeError('callback provided to sync glob')
    return new GlobSync(pattern, options)
  }

  if (!(this instanceof Glob))
    return new Glob(pattern, options, cb)

  setopts(this, pattern, options)
  this._didRealPath = false

  // process each pattern in the minimatch set
  var n = this.minimatch.set.length

  // The matches are stored as {<filename>: true,...} so that
  // duplicates are automagically pruned.
  // Later, we do an Object.keys() on these.
  // Keep them as a list so we can fill in when nonull is set.
  this.matches = new Array(n)

  if (typeof cb === 'function') {
    cb = once(cb)
    this.on('error', cb)
    this.on('end', function (matches) {
      cb(null, matches)
    })
  }

  var self = this
  this._processing = 0

  this._emitQueue = []
  this._processQueue = []
  this.paused = false

  if (this.noprocess)
    return this

  if (n === 0)
    return done()

  var sync = true
  for (var i = 0; i < n; i ++) {
    this._process(this.minimatch.set[i], i, false, done)
  }
  sync = false

  function done () {
    --self._processing
    if (self._processing <= 0) {
      if (sync) {
        process.nextTick(function () {
          self._finish()
        })
      } else {
        self._finish()
      }
    }
  }
}

Glob.prototype._finish = function () {
  assert(this instanceof Glob)
  if (this.aborted)
    return

  if (this.realpath && !this._didRealpath)
    return this._realpath()

  common.finish(this)
  this.emit('end', this.found)
}

Glob.prototype._realpath = function () {
  if (this._didRealpath)
    return

  this._didRealpath = true

  var n = this.matches.length
  if (n === 0)
    return this._finish()

  var self = this
  for (var i = 0; i < this.matches.length; i++)
    this._realpathSet(i, next)

  function next () {
    if (--n === 0)
      self._finish()
  }
}

Glob.prototype._realpathSet = function (index, cb) {
  var matchset = this.matches[index]
  if (!matchset)
    return cb()

  var found = Object.keys(matchset)
  var self = this
  var n = found.length

  if (n === 0)
    return cb()

  var set = this.matches[index] = Object.create(null)
  found.forEach(function (p, i) {
    // If there's a problem with the stat, then it means that
    // one or more of the links in the realpath couldn't be
    // resolved.  just return the abs value in that case.
    p = self._makeAbs(p)
    rp.realpath(p, self.realpathCache, function (er, real) {
      if (!er)
        set[real] = true
      else if (er.syscall === 'stat')
        set[p] = true
      else
        self.emit('error', er) // srsly wtf right here

      if (--n === 0) {
        self.matches[index] = set
        cb()
      }
    })
  })
}

Glob.prototype._mark = function (p) {
  return common.mark(this, p)
}

Glob.prototype._makeAbs = function (f) {
  return common.makeAbs(this, f)
}

Glob.prototype.abort = function () {
  this.aborted = true
  this.emit('abort')
}

Glob.prototype.pause = function () {
  if (!this.paused) {
    this.paused = true
    this.emit('pause')
  }
}

Glob.prototype.resume = function () {
  if (this.paused) {
    this.emit('resume')
    this.paused = false
    if (this._emitQueue.length) {
      var eq = this._emitQueue.slice(0)
      this._emitQueue.length = 0
      for (var i = 0; i < eq.length; i ++) {
        var e = eq[i]
        this._emitMatch(e[0], e[1])
      }
    }
    if (this._processQueue.length) {
      var pq = this._processQueue.slice(0)
      this._processQueue.length = 0
      for (var i = 0; i < pq.length; i ++) {
        var p = pq[i]
        this._processing--
        this._process(p[0], p[1], p[2], p[3])
      }
    }
  }
}

Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
  assert(this instanceof Glob)
  assert(typeof cb === 'function')

  if (this.aborted)
    return

  this._processing++
  if (this.paused) {
    this._processQueue.push([pattern, index, inGlobStar, cb])
    return
  }

  //console.error('PROCESS %d', this._processing, pattern)

  // Get the first [n] parts of pattern that are all strings.
  var n = 0
  while (typeof pattern[n] === 'string') {
    n ++
  }
  // now n is the index of the first one that is *not* a string.

  // see if there's anything else
  var prefix
  switch (n) {
    // if not, then this is rather simple
    case pattern.length:
      this._processSimple(pattern.join('/'), index, cb)
      return

    case 0:
      // pattern *starts* with some non-trivial item.
      // going to readdir(cwd), but not include the prefix in matches.
      prefix = null
      break

    default:
      // pattern has some string bits in the front.
      // whatever it starts with, whether that's 'absolute' like /foo/bar,
      // or 'relative' like '../baz'
      prefix = pattern.slice(0, n).join('/')
      break
  }

  var remain = pattern.slice(n)

  // get the list of entries.
  var read
  if (prefix === null)
    read = '.'
  else if (isAbsolute(prefix) || isAbsolute(pattern.join('/'))) {
    if (!prefix || !isAbsolute(prefix))
      prefix = '/' + prefix
    read = prefix
  } else
    read = prefix

  var abs = this._makeAbs(read)

  //if ignored, skip _processing
  if (childrenIgnored(this, read))
    return cb()

  var isGlobStar = remain[0] === minimatch.GLOBSTAR
  if (isGlobStar)
    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb)
  else
    this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb)
}

Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
  var self = this
  this._readdir(abs, inGlobStar, function (er, entries) {
    return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
  })
}

Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {

  // if the abs isn't a dir, then nothing can match!
  if (!entries)
    return cb()

  // It will only match dot entries if it starts with a dot, or if
  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
  var pn = remain[0]
  var negate = !!this.minimatch.negate
  var rawGlob = pn._glob
  var dotOk = this.dot || rawGlob.charAt(0) === '.'

  var matchedEntries = []
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i]
    if (e.charAt(0) !== '.' || dotOk) {
      var m
      if (negate && !prefix) {
        m = !e.match(pn)
      } else {
        m = e.match(pn)
      }
      if (m)
        matchedEntries.push(e)
    }
  }

  //console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)

  var len = matchedEntries.length
  // If there are no matched entries, then nothing matches.
  if (len === 0)
    return cb()

  // if this is the last remaining pattern bit, then no need for
  // an additional stat *unless* the user has specified mark or
  // stat explicitly.  We know they exist, since readdir returned
  // them.

  if (remain.length === 1 && !this.mark && !this.stat) {
    if (!this.matches[index])
      this.matches[index] = Object.create(null)

    for (var i = 0; i < len; i ++) {
      var e = matchedEntries[i]
      if (prefix) {
        if (prefix !== '/')
          e = prefix + '/' + e
        else
          e = prefix + e
      }

      if (e.charAt(0) === '/' && !this.nomount) {
        e = path.join(this.root, e)
      }
      this._emitMatch(index, e)
    }
    // This was the last one, and no stats were needed
    return cb()
  }

  // now test all matched entries as stand-ins for that part
  // of the pattern.
  remain.shift()
  for (var i = 0; i < len; i ++) {
    var e = matchedEntries[i]
    var newPattern
    if (prefix) {
      if (prefix !== '/')
        e = prefix + '/' + e
      else
        e = prefix + e
    }
    this._process([e].concat(remain), index, inGlobStar, cb)
  }
  cb()
}

Glob.prototype._emitMatch = function (index, e) {
  if (this.aborted)
    return

  if (isIgnored(this, e))
    return

  if (this.paused) {
    this._emitQueue.push([index, e])
    return
  }

  var abs = isAbsolute(e) ? e : this._makeAbs(e)

  if (this.mark)
    e = this._mark(e)

  if (this.absolute)
    e = abs

  if (this.matches[index][e])
    return

  if (this.nodir) {
    var c = this.cache[abs]
    if (c === 'DIR' || Array.isArray(c))
      return
  }

  this.matches[index][e] = true

  var st = this.statCache[abs]
  if (st)
    this.emit('stat', e, st)

  this.emit('match', e)
}

Glob.prototype._readdirInGlobStar = function (abs, cb) {
  if (this.aborted)
    return

  // follow all symlinked directories forever
  // just proceed as if this is a non-globstar situation
  if (this.follow)
    return this._readdir(abs, false, cb)

  var lstatkey = 'lstat\0' + abs
  var self = this
  var lstatcb = inflight(lstatkey, lstatcb_)

  if (lstatcb)
    fs.lstat(abs, lstatcb)

  function lstatcb_ (er, lstat) {
    if (er && er.code === 'ENOENT')
      return cb()

    var isSym = lstat && lstat.isSymbolicLink()
    self.symlinks[abs] = isSym

    // If it's not a symlink or a dir, then it's definitely a regular file.
    // don't bother doing a readdir in that case.
    if (!isSym && lstat && !lstat.isDirectory()) {
      self.cache[abs] = 'FILE'
      cb()
    } else
      self._readdir(abs, false, cb)
  }
}

Glob.prototype._readdir = function (abs, inGlobStar, cb) {
  if (this.aborted)
    return

  cb = inflight('readdir\0'+abs+'\0'+inGlobStar, cb)
  if (!cb)
    return

  //console.error('RD %j %j', +inGlobStar, abs)
  if (inGlobStar && !ownProp(this.symlinks, abs))
    return this._readdirInGlobStar(abs, cb)

  if (ownProp(this.cache, abs)) {
    var c = this.cache[abs]
    if (!c || c === 'FILE')
      return cb()

    if (Array.isArray(c))
      return cb(null, c)
  }

  var self = this
  fs.readdir(abs, readdirCb(this, abs, cb))
}

function readdirCb (self, abs, cb) {
  return function (er, entries) {
    if (er)
      self._readdirError(abs, er, cb)
    else
      self._readdirEntries(abs, entries, cb)
  }
}

Glob.prototype._readdirEntries = function (abs, entries, cb) {
  if (this.aborted)
    return

  // if we haven't asked to stat everything, then just
  // assume that everything in there exists, so we can avoid
  // having to stat it a second time.
  if (!this.mark && !this.stat) {
    for (var i = 0; i < entries.length; i ++) {
      var e = entries[i]
      if (abs === '/')
        e = abs + e
      else
        e = abs + '/' + e
      this.cache[e] = true
    }
  }

  this.cache[abs] = entries
  return cb(null, entries)
}

Glob.prototype._readdirError = function (f, er, cb) {
  if (this.aborted)
    return

  // handle errors, and cache the information
  switch (er.code) {
    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
    case 'ENOTDIR': // totally normal. means it *does* exist.
      var abs = this._makeAbs(f)
      this.cache[abs] = 'FILE'
      if (abs === this.cwdAbs) {
        var error = new Error(er.code + ' invalid cwd ' + this.cwd)
        error.path = this.cwd
        error.code = er.code
        this.emit('error', error)
        this.abort()
      }
      break

    case 'ENOENT': // not terribly unusual
    case 'ELOOP':
    case 'ENAMETOOLONG':
    case 'UNKNOWN':
      this.cache[this._makeAbs(f)] = false
      break

    default: // some unusual error.  Treat as failure.
      this.cache[this._makeAbs(f)] = false
      if (this.strict) {
        this.emit('error', er)
        // If the error is handled, then we abort
        // if not, we threw out of here
        this.abort()
      }
      if (!this.silent)
        console.error('glob error', er)
      break
  }

  return cb()
}

Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
  var self = this
  this._readdir(abs, inGlobStar, function (er, entries) {
    self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
  })
}


Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
  //console.error('pgs2', prefix, remain[0], entries)

  // no entries means not a dir, so it can never have matches
  // foo.txt/** doesn't match foo.txt
  if (!entries)
    return cb()

  // test without the globstar, and with every child both below
  // and replacing the globstar.
  var remainWithoutGlobStar = remain.slice(1)
  var gspref = prefix ? [ prefix ] : []
  var noGlobStar = gspref.concat(remainWithoutGlobStar)

  // the noGlobStar pattern exits the inGlobStar state
  this._process(noGlobStar, index, false, cb)

  var isSym = this.symlinks[abs]
  var len = entries.length

  // If it's a symlink, and we're in a globstar, then stop
  if (isSym && inGlobStar)
    return cb()

  for (var i = 0; i < len; i++) {
    var e = entries[i]
    if (e.charAt(0) === '.' && !this.dot)
      continue

    // these two cases enter the inGlobStar state
    var instead = gspref.concat(entries[i], remainWithoutGlobStar)
    this._process(instead, index, true, cb)

    var below = gspref.concat(entries[i], remain)
    this._process(below, index, true, cb)
  }

  cb()
}

Glob.prototype._processSimple = function (prefix, index, cb) {
  // XXX review this.  Shouldn't it be doing the mounting etc
  // before doing stat?  kinda weird?
  var self = this
  this._stat(prefix, function (er, exists) {
    self._processSimple2(prefix, index, er, exists, cb)
  })
}
Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {

  //console.error('ps2', prefix, exists)

  if (!this.matches[index])
    this.matches[index] = Object.create(null)

  // If it doesn't exist, then just mark the lack of results
  if (!exists)
    return cb()

  if (prefix && isAbsolute(prefix) && !this.nomount) {
    var trail = /[\/\\]$/.test(prefix)
    if (prefix.charAt(0) === '/') {
      prefix = path.join(this.root, prefix)
    } else {
      prefix = path.resolve(this.root, prefix)
      if (trail)
        prefix += '/'
    }
  }

  if (process.platform === 'win32')
    prefix = prefix.replace(/\\/g, '/')

  // Mark this as a match
  this._emitMatch(index, prefix)
  cb()
}

// Returns either 'DIR', 'FILE', or false
Glob.prototype._stat = function (f, cb) {
  var abs = this._makeAbs(f)
  var needDir = f.slice(-1) === '/'

  if (f.length > this.maxLength)
    return cb()

  if (!this.stat && ownProp(this.cache, abs)) {
    var c = this.cache[abs]

    if (Array.isArray(c))
      c = 'DIR'

    // It exists, but maybe not how we need it
    if (!needDir || c === 'DIR')
      return cb(null, c)

    if (needDir && c === 'FILE')
      return cb()

    // otherwise we have to stat, because maybe c=true
    // if we know it exists, but not what it is.
  }

  var exists
  var stat = this.statCache[abs]
  if (stat !== undefined) {
    if (stat === false)
      return cb(null, stat)
    else {
      var type = stat.isDirectory() ? 'DIR' : 'FILE'
      if (needDir && type === 'FILE')
        return cb()
      else
        return cb(null, type, stat)
    }
  }

  var self = this
  var statcb = inflight('stat\0' + abs, lstatcb_)
  if (statcb)
    fs.lstat(abs, statcb)

  function lstatcb_ (er, lstat) {
    if (lstat && lstat.isSymbolicLink()) {
      // If it's a symlink, then treat it as the target, unless
      // the target does not exist, then treat it as a file.
      return fs.stat(abs, function (er, stat) {
        if (er)
          self._stat2(f, abs, null, lstat, cb)
        else
          self._stat2(f, abs, er, stat, cb)
      })
    } else {
      self._stat2(f, abs, er, lstat, cb)
    }
  }
}

Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
  if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
    this.statCache[abs] = false
    return cb()
  }

  var needDir = f.slice(-1) === '/'
  this.statCache[abs] = stat

  if (abs.slice(-1) === '/' && stat && !stat.isDirectory())
    return cb(null, false, stat)

  var c = true
  if (stat)
    c = stat.isDirectory() ? 'DIR' : 'FILE'
  this.cache[abs] = this.cache[abs] || c

  if (needDir && c === 'FILE')
    return cb()

  return cb(null, c, stat)
}


/***/ }),

/***/ 9010:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = globSync
globSync.GlobSync = GlobSync

var fs = __webpack_require__(5747)
var rp = __webpack_require__(6863)
var minimatch = __webpack_require__(3973)
var Minimatch = minimatch.Minimatch
var Glob = __webpack_require__(1957).Glob
var util = __webpack_require__(1669)
var path = __webpack_require__(5622)
var assert = __webpack_require__(2357)
var isAbsolute = __webpack_require__(8714)
var common = __webpack_require__(7625)
var alphasort = common.alphasort
var alphasorti = common.alphasorti
var setopts = common.setopts
var ownProp = common.ownProp
var childrenIgnored = common.childrenIgnored
var isIgnored = common.isIgnored

function globSync (pattern, options) {
  if (typeof options === 'function' || arguments.length === 3)
    throw new TypeError('callback provided to sync glob\n'+
                        'See: https://github.com/isaacs/node-glob/issues/167')

  return new GlobSync(pattern, options).found
}

function GlobSync (pattern, options) {
  if (!pattern)
    throw new Error('must provide pattern')

  if (typeof options === 'function' || arguments.length === 3)
    throw new TypeError('callback provided to sync glob\n'+
                        'See: https://github.com/isaacs/node-glob/issues/167')

  if (!(this instanceof GlobSync))
    return new GlobSync(pattern, options)

  setopts(this, pattern, options)

  if (this.noprocess)
    return this

  var n = this.minimatch.set.length
  this.matches = new Array(n)
  for (var i = 0; i < n; i ++) {
    this._process(this.minimatch.set[i], i, false)
  }
  this._finish()
}

GlobSync.prototype._finish = function () {
  assert(this instanceof GlobSync)
  if (this.realpath) {
    var self = this
    this.matches.forEach(function (matchset, index) {
      var set = self.matches[index] = Object.create(null)
      for (var p in matchset) {
        try {
          p = self._makeAbs(p)
          var real = rp.realpathSync(p, self.realpathCache)
          set[real] = true
        } catch (er) {
          if (er.syscall === 'stat')
            set[self._makeAbs(p)] = true
          else
            throw er
        }
      }
    })
  }
  common.finish(this)
}


GlobSync.prototype._process = function (pattern, index, inGlobStar) {
  assert(this instanceof GlobSync)

  // Get the first [n] parts of pattern that are all strings.
  var n = 0
  while (typeof pattern[n] === 'string') {
    n ++
  }
  // now n is the index of the first one that is *not* a string.

  // See if there's anything else
  var prefix
  switch (n) {
    // if not, then this is rather simple
    case pattern.length:
      this._processSimple(pattern.join('/'), index)
      return

    case 0:
      // pattern *starts* with some non-trivial item.
      // going to readdir(cwd), but not include the prefix in matches.
      prefix = null
      break

    default:
      // pattern has some string bits in the front.
      // whatever it starts with, whether that's 'absolute' like /foo/bar,
      // or 'relative' like '../baz'
      prefix = pattern.slice(0, n).join('/')
      break
  }

  var remain = pattern.slice(n)

  // get the list of entries.
  var read
  if (prefix === null)
    read = '.'
  else if (isAbsolute(prefix) || isAbsolute(pattern.join('/'))) {
    if (!prefix || !isAbsolute(prefix))
      prefix = '/' + prefix
    read = prefix
  } else
    read = prefix

  var abs = this._makeAbs(read)

  //if ignored, skip processing
  if (childrenIgnored(this, read))
    return

  var isGlobStar = remain[0] === minimatch.GLOBSTAR
  if (isGlobStar)
    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar)
  else
    this._processReaddir(prefix, read, abs, remain, index, inGlobStar)
}


GlobSync.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar) {
  var entries = this._readdir(abs, inGlobStar)

  // if the abs isn't a dir, then nothing can match!
  if (!entries)
    return

  // It will only match dot entries if it starts with a dot, or if
  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
  var pn = remain[0]
  var negate = !!this.minimatch.negate
  var rawGlob = pn._glob
  var dotOk = this.dot || rawGlob.charAt(0) === '.'

  var matchedEntries = []
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i]
    if (e.charAt(0) !== '.' || dotOk) {
      var m
      if (negate && !prefix) {
        m = !e.match(pn)
      } else {
        m = e.match(pn)
      }
      if (m)
        matchedEntries.push(e)
    }
  }

  var len = matchedEntries.length
  // If there are no matched entries, then nothing matches.
  if (len === 0)
    return

  // if this is the last remaining pattern bit, then no need for
  // an additional stat *unless* the user has specified mark or
  // stat explicitly.  We know they exist, since readdir returned
  // them.

  if (remain.length === 1 && !this.mark && !this.stat) {
    if (!this.matches[index])
      this.matches[index] = Object.create(null)

    for (var i = 0; i < len; i ++) {
      var e = matchedEntries[i]
      if (prefix) {
        if (prefix.slice(-1) !== '/')
          e = prefix + '/' + e
        else
          e = prefix + e
      }

      if (e.charAt(0) === '/' && !this.nomount) {
        e = path.join(this.root, e)
      }
      this._emitMatch(index, e)
    }
    // This was the last one, and no stats were needed
    return
  }

  // now test all matched entries as stand-ins for that part
  // of the pattern.
  remain.shift()
  for (var i = 0; i < len; i ++) {
    var e = matchedEntries[i]
    var newPattern
    if (prefix)
      newPattern = [prefix, e]
    else
      newPattern = [e]
    this._process(newPattern.concat(remain), index, inGlobStar)
  }
}


GlobSync.prototype._emitMatch = function (index, e) {
  if (isIgnored(this, e))
    return

  var abs = this._makeAbs(e)

  if (this.mark)
    e = this._mark(e)

  if (this.absolute) {
    e = abs
  }

  if (this.matches[index][e])
    return

  if (this.nodir) {
    var c = this.cache[abs]
    if (c === 'DIR' || Array.isArray(c))
      return
  }

  this.matches[index][e] = true

  if (this.stat)
    this._stat(e)
}


GlobSync.prototype._readdirInGlobStar = function (abs) {
  // follow all symlinked directories forever
  // just proceed as if this is a non-globstar situation
  if (this.follow)
    return this._readdir(abs, false)

  var entries
  var lstat
  var stat
  try {
    lstat = fs.lstatSync(abs)
  } catch (er) {
    if (er.code === 'ENOENT') {
      // lstat failed, doesn't exist
      return null
    }
  }

  var isSym = lstat && lstat.isSymbolicLink()
  this.symlinks[abs] = isSym

  // If it's not a symlink or a dir, then it's definitely a regular file.
  // don't bother doing a readdir in that case.
  if (!isSym && lstat && !lstat.isDirectory())
    this.cache[abs] = 'FILE'
  else
    entries = this._readdir(abs, false)

  return entries
}

GlobSync.prototype._readdir = function (abs, inGlobStar) {
  var entries

  if (inGlobStar && !ownProp(this.symlinks, abs))
    return this._readdirInGlobStar(abs)

  if (ownProp(this.cache, abs)) {
    var c = this.cache[abs]
    if (!c || c === 'FILE')
      return null

    if (Array.isArray(c))
      return c
  }

  try {
    return this._readdirEntries(abs, fs.readdirSync(abs))
  } catch (er) {
    this._readdirError(abs, er)
    return null
  }
}

GlobSync.prototype._readdirEntries = function (abs, entries) {
  // if we haven't asked to stat everything, then just
  // assume that everything in there exists, so we can avoid
  // having to stat it a second time.
  if (!this.mark && !this.stat) {
    for (var i = 0; i < entries.length; i ++) {
      var e = entries[i]
      if (abs === '/')
        e = abs + e
      else
        e = abs + '/' + e
      this.cache[e] = true
    }
  }

  this.cache[abs] = entries

  // mark and cache dir-ness
  return entries
}

GlobSync.prototype._readdirError = function (f, er) {
  // handle errors, and cache the information
  switch (er.code) {
    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
    case 'ENOTDIR': // totally normal. means it *does* exist.
      var abs = this._makeAbs(f)
      this.cache[abs] = 'FILE'
      if (abs === this.cwdAbs) {
        var error = new Error(er.code + ' invalid cwd ' + this.cwd)
        error.path = this.cwd
        error.code = er.code
        throw error
      }
      break

    case 'ENOENT': // not terribly unusual
    case 'ELOOP':
    case 'ENAMETOOLONG':
    case 'UNKNOWN':
      this.cache[this._makeAbs(f)] = false
      break

    default: // some unusual error.  Treat as failure.
      this.cache[this._makeAbs(f)] = false
      if (this.strict)
        throw er
      if (!this.silent)
        console.error('glob error', er)
      break
  }
}

GlobSync.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar) {

  var entries = this._readdir(abs, inGlobStar)

  // no entries means not a dir, so it can never have matches
  // foo.txt/** doesn't match foo.txt
  if (!entries)
    return

  // test without the globstar, and with every child both below
  // and replacing the globstar.
  var remainWithoutGlobStar = remain.slice(1)
  var gspref = prefix ? [ prefix ] : []
  var noGlobStar = gspref.concat(remainWithoutGlobStar)

  // the noGlobStar pattern exits the inGlobStar state
  this._process(noGlobStar, index, false)

  var len = entries.length
  var isSym = this.symlinks[abs]

  // If it's a symlink, and we're in a globstar, then stop
  if (isSym && inGlobStar)
    return

  for (var i = 0; i < len; i++) {
    var e = entries[i]
    if (e.charAt(0) === '.' && !this.dot)
      continue

    // these two cases enter the inGlobStar state
    var instead = gspref.concat(entries[i], remainWithoutGlobStar)
    this._process(instead, index, true)

    var below = gspref.concat(entries[i], remain)
    this._process(below, index, true)
  }
}

GlobSync.prototype._processSimple = function (prefix, index) {
  // XXX review this.  Shouldn't it be doing the mounting etc
  // before doing stat?  kinda weird?
  var exists = this._stat(prefix)

  if (!this.matches[index])
    this.matches[index] = Object.create(null)

  // If it doesn't exist, then just mark the lack of results
  if (!exists)
    return

  if (prefix && isAbsolute(prefix) && !this.nomount) {
    var trail = /[\/\\]$/.test(prefix)
    if (prefix.charAt(0) === '/') {
      prefix = path.join(this.root, prefix)
    } else {
      prefix = path.resolve(this.root, prefix)
      if (trail)
        prefix += '/'
    }
  }

  if (process.platform === 'win32')
    prefix = prefix.replace(/\\/g, '/')

  // Mark this as a match
  this._emitMatch(index, prefix)
}

// Returns either 'DIR', 'FILE', or false
GlobSync.prototype._stat = function (f) {
  var abs = this._makeAbs(f)
  var needDir = f.slice(-1) === '/'

  if (f.length > this.maxLength)
    return false

  if (!this.stat && ownProp(this.cache, abs)) {
    var c = this.cache[abs]

    if (Array.isArray(c))
      c = 'DIR'

    // It exists, but maybe not how we need it
    if (!needDir || c === 'DIR')
      return c

    if (needDir && c === 'FILE')
      return false

    // otherwise we have to stat, because maybe c=true
    // if we know it exists, but not what it is.
  }

  var exists
  var stat = this.statCache[abs]
  if (!stat) {
    var lstat
    try {
      lstat = fs.lstatSync(abs)
    } catch (er) {
      if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
        this.statCache[abs] = false
        return false
      }
    }

    if (lstat && lstat.isSymbolicLink()) {
      try {
        stat = fs.statSync(abs)
      } catch (er) {
        stat = lstat
      }
    } else {
      stat = lstat
    }
  }

  this.statCache[abs] = stat

  var c = true
  if (stat)
    c = stat.isDirectory() ? 'DIR' : 'FILE'

  this.cache[abs] = this.cache[abs] || c

  if (needDir && c === 'FILE')
    return false

  return c
}

GlobSync.prototype._mark = function (p) {
  return common.mark(this, p)
}

GlobSync.prototype._makeAbs = function (f) {
  return common.makeAbs(this, f)
}


/***/ }),

/***/ 2492:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wrappy = __webpack_require__(2940)
var reqs = Object.create(null)
var once = __webpack_require__(1223)

module.exports = wrappy(inflight)

function inflight (key, cb) {
  if (reqs[key]) {
    reqs[key].push(cb)
    return null
  } else {
    reqs[key] = [cb]
    return makeres(key)
  }
}

function makeres (key) {
  return once(function RES () {
    var cbs = reqs[key]
    var len = cbs.length
    var args = slice(arguments)

    // XXX It's somewhat ambiguous whether a new callback added in this
    // pass should be queued for later execution if something in the
    // list of callbacks throws, or if it should just be discarded.
    // However, it's such an edge case that it hardly matters, and either
    // choice is likely as surprising as the other.
    // As it happens, we do go ahead and schedule it for later execution.
    try {
      for (var i = 0; i < len; i++) {
        cbs[i].apply(null, args)
      }
    } finally {
      if (cbs.length > len) {
        // added more in the interim.
        // de-zalgo, just in case, but don't call again.
        cbs.splice(0, len)
        process.nextTick(function () {
          RES.apply(null, args)
        })
      } else {
        delete reqs[key]
      }
    }
  })
}

function slice (args) {
  var length = args.length
  var array = []

  for (var i = 0; i < length; i++) array[i] = args[i]
  return array
}


/***/ }),

/***/ 4124:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

try {
  var util = __webpack_require__(1669);
  /* istanbul ignore next */
  if (typeof util.inherits !== 'function') throw '';
  module.exports = util.inherits;
} catch (e) {
  /* istanbul ignore next */
  module.exports = __webpack_require__(8544);
}


/***/ }),

/***/ 8544:
/***/ ((module) => {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}


/***/ }),

/***/ 7810:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */



var isObject = __webpack_require__(5639);

function isObjectObject(o) {
  return isObject(o) === true
    && Object.prototype.toString.call(o) === '[object Object]';
}

module.exports = function isPlainObject(o) {
  var ctor,prot;

  if (isObjectObject(o) === false) return false;

  // If has modified constructor
  ctor = o.constructor;
  if (typeof ctor !== 'function') return false;

  // If has modified prototype
  prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
};


/***/ }),

/***/ 5639:
/***/ ((module) => {

"use strict";
/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */



module.exports = function isObject(val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
};


/***/ }),

/***/ 2533:
/***/ ((module) => {

"use strict";


var traverse = module.exports = function (schema, opts, cb) {
  // Legacy support for v0.3.1 and earlier.
  if (typeof opts == 'function') {
    cb = opts;
    opts = {};
  }

  cb = opts.cb || cb;
  var pre = (typeof cb == 'function') ? cb : cb.pre || function() {};
  var post = cb.post || function() {};

  _traverse(opts, pre, post, schema, '', schema);
};


traverse.keywords = {
  additionalItems: true,
  items: true,
  contains: true,
  additionalProperties: true,
  propertyNames: true,
  not: true
};

traverse.arrayKeywords = {
  items: true,
  allOf: true,
  anyOf: true,
  oneOf: true
};

traverse.propsKeywords = {
  definitions: true,
  properties: true,
  patternProperties: true,
  dependencies: true
};

traverse.skipKeywords = {
  default: true,
  enum: true,
  const: true,
  required: true,
  maximum: true,
  minimum: true,
  exclusiveMaximum: true,
  exclusiveMinimum: true,
  multipleOf: true,
  maxLength: true,
  minLength: true,
  pattern: true,
  format: true,
  maxItems: true,
  minItems: true,
  uniqueItems: true,
  maxProperties: true,
  minProperties: true
};


function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
  if (schema && typeof schema == 'object' && !Array.isArray(schema)) {
    pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
    for (var key in schema) {
      var sch = schema[key];
      if (Array.isArray(sch)) {
        if (key in traverse.arrayKeywords) {
          for (var i=0; i<sch.length; i++)
            _traverse(opts, pre, post, sch[i], jsonPtr + '/' + key + '/' + i, rootSchema, jsonPtr, key, schema, i);
        }
      } else if (key in traverse.propsKeywords) {
        if (sch && typeof sch == 'object') {
          for (var prop in sch)
            _traverse(opts, pre, post, sch[prop], jsonPtr + '/' + key + '/' + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
        }
      } else if (key in traverse.keywords || (opts.allKeys && !(key in traverse.skipKeywords))) {
        _traverse(opts, pre, post, sch, jsonPtr + '/' + key, rootSchema, jsonPtr, key, schema);
      }
    }
    post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
  }
}


function escapeJsonPtr(str) {
  return str.replace(/~/g, '~0').replace(/\//g, '~1');
}


/***/ }),

/***/ 6904:
/***/ ((module, exports, __webpack_require__) => {

"use strict";
Object.defineProperty(exports, "__esModule", ({value:true}));var _parse=__webpack_require__(7583);var _parse2=_interopRequireDefault(_parse);var _stringify=__webpack_require__(749);var _stringify2=_interopRequireDefault(_stringify);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}exports.default={parse:_parse2.default,stringify:_stringify2.default};module.exports=exports['default'];

/***/ }),

/***/ 7583:
/***/ ((module, exports, __webpack_require__) => {

"use strict";
Object.defineProperty(exports, "__esModule", ({value:true}));var _typeof=typeof Symbol==='function'&&typeof Symbol.iterator==='symbol'?function(obj){return typeof obj}:function(obj){return obj&&typeof Symbol==='function'&&obj.constructor===Symbol&&obj!==Symbol.prototype?'symbol':typeof obj};exports.default=parse;var _util=__webpack_require__(7393);var util=_interopRequireWildcard(_util);function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))newObj[key]=obj[key]}}newObj.default=obj;return newObj}}var source=void 0;var parseState=void 0;var stack=void 0;var pos=void 0;var line=void 0;var column=void 0;var token=void 0;var key=void 0;var root=void 0;function parse(text,reviver){source=String(text);parseState='start';stack=[];pos=0;line=1;column=0;token=undefined;key=undefined;root=undefined;do{token=lex();parseStates[parseState]()}while(token.type!=='eof');if(typeof reviver==='function'){return internalize({'':root},'',reviver)}return root}function internalize(holder,name,reviver){var value=holder[name];if(value!=null&&(typeof value==='undefined'?'undefined':_typeof(value))==='object'){for(var _key in value){var replacement=internalize(value,_key,reviver);if(replacement===undefined){delete value[_key]}else{value[_key]=replacement}}}return reviver.call(holder,name,value)}var lexState=void 0;var buffer=void 0;var doubleQuote=void 0;var _sign=void 0;var c=void 0;function lex(){lexState='default';buffer='';doubleQuote=false;_sign=1;for(;;){c=peek();var _token=lexStates[lexState]();if(_token){return _token}}}function peek(){if(source[pos]){return String.fromCodePoint(source.codePointAt(pos))}}function read(){var c=peek();if(c==='\n'){line++;column=0}else if(c){column+=c.length}else{column++}if(c){pos+=c.length}return c}var lexStates={default:function _default(){switch(c){case'\t':case'\x0B':case'\f':case' ':case'\xA0':case'\uFEFF':case'\n':case'\r':case'\u2028':case'\u2029':read();return;case'/':read();lexState='comment';return;case undefined:read();return newToken('eof');}if(util.isSpaceSeparator(c)){read();return}return lexStates[parseState]()},comment:function comment(){switch(c){case'*':read();lexState='multiLineComment';return;case'/':read();lexState='singleLineComment';return;}throw invalidChar(read())},multiLineComment:function multiLineComment(){switch(c){case'*':read();lexState='multiLineCommentAsterisk';return;case undefined:throw invalidChar(read());}read()},multiLineCommentAsterisk:function multiLineCommentAsterisk(){switch(c){case'*':read();return;case'/':read();lexState='default';return;case undefined:throw invalidChar(read());}read();lexState='multiLineComment'},singleLineComment:function singleLineComment(){switch(c){case'\n':case'\r':case'\u2028':case'\u2029':read();lexState='default';return;case undefined:read();return newToken('eof');}read()},value:function value(){switch(c){case'{':case'[':return newToken('punctuator',read());case'n':read();literal('ull');return newToken('null',null);case't':read();literal('rue');return newToken('boolean',true);case'f':read();literal('alse');return newToken('boolean',false);case'-':case'+':if(read()==='-'){_sign=-1}lexState='sign';return;case'.':buffer=read();lexState='decimalPointLeading';return;case'0':buffer=read();lexState='zero';return;case'1':case'2':case'3':case'4':case'5':case'6':case'7':case'8':case'9':buffer=read();lexState='decimalInteger';return;case'I':read();literal('nfinity');return newToken('numeric',Infinity);case'N':read();literal('aN');return newToken('numeric',NaN);case'"':case'\'':doubleQuote=read()==='"';buffer='';lexState='string';return;}throw invalidChar(read())},identifierNameStartEscape:function identifierNameStartEscape(){if(c!=='u'){throw invalidChar(read())}read();var u=unicodeEscape();switch(u){case'$':case'_':break;default:if(!util.isIdStartChar(u)){throw invalidIdentifier()}break;}buffer+=u;lexState='identifierName'},identifierName:function identifierName(){switch(c){case'$':case'_':case'\u200C':case'\u200D':buffer+=read();return;case'\\':read();lexState='identifierNameEscape';return;}if(util.isIdContinueChar(c)){buffer+=read();return}return newToken('identifier',buffer)},identifierNameEscape:function identifierNameEscape(){if(c!=='u'){throw invalidChar(read())}read();var u=unicodeEscape();switch(u){case'$':case'_':case'\u200C':case'\u200D':break;default:if(!util.isIdContinueChar(u)){throw invalidIdentifier()}break;}buffer+=u;lexState='identifierName'},sign:function sign(){switch(c){case'.':buffer=read();lexState='decimalPointLeading';return;case'0':buffer=read();lexState='zero';return;case'1':case'2':case'3':case'4':case'5':case'6':case'7':case'8':case'9':buffer=read();lexState='decimalInteger';return;case'I':read();literal('nfinity');return newToken('numeric',_sign*Infinity);case'N':read();literal('aN');return newToken('numeric',NaN);}throw invalidChar(read())},zero:function zero(){switch(c){case'.':buffer+=read();lexState='decimalPoint';return;case'e':case'E':buffer+=read();lexState='decimalExponent';return;case'x':case'X':buffer+=read();lexState='hexadecimal';return;}return newToken('numeric',_sign*0)},decimalInteger:function decimalInteger(){switch(c){case'.':buffer+=read();lexState='decimalPoint';return;case'e':case'E':buffer+=read();lexState='decimalExponent';return;}if(util.isDigit(c)){buffer+=read();return}return newToken('numeric',_sign*Number(buffer))},decimalPointLeading:function decimalPointLeading(){if(util.isDigit(c)){buffer+=read();lexState='decimalFraction';return}throw invalidChar(read())},decimalPoint:function decimalPoint(){switch(c){case'e':case'E':buffer+=read();lexState='decimalExponent';return;}if(util.isDigit(c)){buffer+=read();lexState='decimalFraction';return}return newToken('numeric',_sign*Number(buffer))},decimalFraction:function decimalFraction(){switch(c){case'e':case'E':buffer+=read();lexState='decimalExponent';return;}if(util.isDigit(c)){buffer+=read();return}return newToken('numeric',_sign*Number(buffer))},decimalExponent:function decimalExponent(){switch(c){case'+':case'-':buffer+=read();lexState='decimalExponentSign';return;}if(util.isDigit(c)){buffer+=read();lexState='decimalExponentInteger';return}throw invalidChar(read())},decimalExponentSign:function decimalExponentSign(){if(util.isDigit(c)){buffer+=read();lexState='decimalExponentInteger';return}throw invalidChar(read())},decimalExponentInteger:function decimalExponentInteger(){if(util.isDigit(c)){buffer+=read();return}return newToken('numeric',_sign*Number(buffer))},hexadecimal:function hexadecimal(){if(util.isHexDigit(c)){buffer+=read();lexState='hexadecimalInteger';return}throw invalidChar(read())},hexadecimalInteger:function hexadecimalInteger(){if(util.isHexDigit(c)){buffer+=read();return}return newToken('numeric',_sign*Number(buffer))},string:function string(){switch(c){case'\\':read();buffer+=escape();return;case'"':if(doubleQuote){read();return newToken('string',buffer)}buffer+=read();return;case'\'':if(!doubleQuote){read();return newToken('string',buffer)}buffer+=read();return;case'\n':case'\r':throw invalidChar(read());case'\u2028':case'\u2029':separatorChar(c);break;case undefined:throw invalidChar(read());}buffer+=read()},start:function start(){switch(c){case'{':case'[':return newToken('punctuator',read());}lexState='value'},beforePropertyName:function beforePropertyName(){switch(c){case'$':case'_':buffer=read();lexState='identifierName';return;case'\\':read();lexState='identifierNameStartEscape';return;case'}':return newToken('punctuator',read());case'"':case'\'':doubleQuote=read()==='"';lexState='string';return;}if(util.isIdStartChar(c)){buffer+=read();lexState='identifierName';return}throw invalidChar(read())},afterPropertyName:function afterPropertyName(){if(c===':'){return newToken('punctuator',read())}throw invalidChar(read())},beforePropertyValue:function beforePropertyValue(){lexState='value'},afterPropertyValue:function afterPropertyValue(){switch(c){case',':case'}':return newToken('punctuator',read());}throw invalidChar(read())},beforeArrayValue:function beforeArrayValue(){if(c===']'){return newToken('punctuator',read())}lexState='value'},afterArrayValue:function afterArrayValue(){switch(c){case',':case']':return newToken('punctuator',read());}throw invalidChar(read())},end:function end(){throw invalidChar(read())}};function newToken(type,value){return{type:type,value:value,line:line,column:column}}function literal(s){var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=s[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var _c=_step.value;var p=peek();if(p!==_c){throw invalidChar(read())}read()}}catch(err){_didIteratorError=true;_iteratorError=err}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return()}}finally{if(_didIteratorError){throw _iteratorError}}}}function escape(){var c=peek();switch(c){case'b':read();return'\b';case'f':read();return'\f';case'n':read();return'\n';case'r':read();return'\r';case't':read();return'\t';case'v':read();return'\x0B';case'0':read();if(util.isDigit(peek())){throw invalidChar(read())}return'\0';case'x':read();return hexEscape();case'u':read();return unicodeEscape();case'\n':case'\u2028':case'\u2029':read();return'';case'\r':read();if(peek()==='\n'){read()}return'';case'1':case'2':case'3':case'4':case'5':case'6':case'7':case'8':case'9':throw invalidChar(read());case undefined:throw invalidChar(read());}return read()}function hexEscape(){var buffer='';var c=peek();if(!util.isHexDigit(c)){throw invalidChar(read())}buffer+=read();c=peek();if(!util.isHexDigit(c)){throw invalidChar(read())}buffer+=read();return String.fromCodePoint(parseInt(buffer,16))}function unicodeEscape(){var buffer='';var count=4;while(count-->0){var _c2=peek();if(!util.isHexDigit(_c2)){throw invalidChar(read())}buffer+=read()}return String.fromCodePoint(parseInt(buffer,16))}var parseStates={start:function start(){if(token.type==='eof'){throw invalidEOF()}push()},beforePropertyName:function beforePropertyName(){switch(token.type){case'identifier':case'string':key=token.value;parseState='afterPropertyName';return;case'punctuator':pop();return;case'eof':throw invalidEOF();}},afterPropertyName:function afterPropertyName(){if(token.type==='eof'){throw invalidEOF()}parseState='beforePropertyValue'},beforePropertyValue:function beforePropertyValue(){if(token.type==='eof'){throw invalidEOF()}push()},beforeArrayValue:function beforeArrayValue(){if(token.type==='eof'){throw invalidEOF()}if(token.type==='punctuator'&&token.value===']'){pop();return}push()},afterPropertyValue:function afterPropertyValue(){if(token.type==='eof'){throw invalidEOF()}switch(token.value){case',':parseState='beforePropertyName';return;case'}':pop();}},afterArrayValue:function afterArrayValue(){if(token.type==='eof'){throw invalidEOF()}switch(token.value){case',':parseState='beforeArrayValue';return;case']':pop();}},end:function end(){}};function push(){var value=void 0;switch(token.type){case'punctuator':switch(token.value){case'{':value={};break;case'[':value=[];break;}break;case'null':case'boolean':case'numeric':case'string':value=token.value;break;}if(root===undefined){root=value}else{var parent=stack[stack.length-1];if(Array.isArray(parent)){parent.push(value)}else{parent[key]=value}}if(value!==null&&(typeof value==='undefined'?'undefined':_typeof(value))==='object'){stack.push(value);if(Array.isArray(value)){parseState='beforeArrayValue'}else{parseState='beforePropertyName'}}else{var current=stack[stack.length-1];if(current==null){parseState='end'}else if(Array.isArray(current)){parseState='afterArrayValue'}else{parseState='afterPropertyValue'}}}function pop(){stack.pop();var current=stack[stack.length-1];if(current==null){parseState='end'}else if(Array.isArray(current)){parseState='afterArrayValue'}else{parseState='afterPropertyValue'}}function invalidChar(c){if(c===undefined){return syntaxError('JSON5: invalid end of input at '+line+':'+column)}return syntaxError('JSON5: invalid character \''+formatChar(c)+'\' at '+line+':'+column)}function invalidEOF(){return syntaxError('JSON5: invalid end of input at '+line+':'+column)}function invalidIdentifier(){column-=5;return syntaxError('JSON5: invalid identifier character at '+line+':'+column)}function separatorChar(c){console.warn('JSON5: \''+c+'\' is not valid ECMAScript; consider escaping')}function formatChar(c){var replacements={'\'':'\\\'','"':'\\"','\\':'\\\\','\b':'\\b','\f':'\\f','\n':'\\n','\r':'\\r','\t':'\\t','\x0B':'\\v','\0':'\\0','\u2028':'\\u2028','\u2029':'\\u2029'};if(replacements[c]){return replacements[c]}if(c<' '){var hexString=c.charCodeAt(0).toString(16);return'\\x'+('00'+hexString).substring(hexString.length)}return c}function syntaxError(message){var err=new SyntaxError(message);err.lineNumber=line;err.columnNumber=column;return err}module.exports=exports['default'];

/***/ }),

/***/ 749:
/***/ ((module, exports, __webpack_require__) => {

"use strict";
Object.defineProperty(exports, "__esModule", ({value:true}));var _typeof=typeof Symbol==='function'&&typeof Symbol.iterator==='symbol'?function(obj){return typeof obj}:function(obj){return obj&&typeof Symbol==='function'&&obj.constructor===Symbol&&obj!==Symbol.prototype?'symbol':typeof obj};exports.default=stringify;var _util=__webpack_require__(7393);var util=_interopRequireWildcard(_util);function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))newObj[key]=obj[key]}}newObj.default=obj;return newObj}}function stringify(value,replacer,space){var stack=[];var indent='';var propertyList=void 0;var replacerFunc=void 0;var gap='';var quote=void 0;if(replacer!=null&&(typeof replacer==='undefined'?'undefined':_typeof(replacer))==='object'&&!Array.isArray(replacer)){space=replacer.space;quote=replacer.quote;replacer=replacer.replacer}if(typeof replacer==='function'){replacerFunc=replacer}else if(Array.isArray(replacer)){propertyList=[];var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=replacer[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var v=_step.value;var item=void 0;if(typeof v==='string'){item=v}else if(typeof v==='number'||v instanceof String||v instanceof Number){item=String(v)}if(item!==undefined&&propertyList.indexOf(item)<0){propertyList.push(item)}}}catch(err){_didIteratorError=true;_iteratorError=err}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return()}}finally{if(_didIteratorError){throw _iteratorError}}}}if(space instanceof Number){space=Number(space)}else if(space instanceof String){space=String(space)}if(typeof space==='number'){if(space>0){space=Math.min(10,Math.floor(space));gap='          '.substr(0,space)}}else if(typeof space==='string'){gap=space.substr(0,10)}return serializeProperty('',{'':value});function serializeProperty(key,holder){var value=holder[key];if(value!=null){if(typeof value.toJSON5==='function'){value=value.toJSON5(key)}else if(typeof value.toJSON==='function'){value=value.toJSON(key)}}if(replacerFunc){value=replacerFunc.call(holder,key,value)}if(value instanceof Number){value=Number(value)}else if(value instanceof String){value=String(value)}else if(value instanceof Boolean){value=value.valueOf()}switch(value){case null:return'null';case true:return'true';case false:return'false';}if(typeof value==='string'){return quoteString(value,false)}if(typeof value==='number'){return String(value)}if((typeof value==='undefined'?'undefined':_typeof(value))==='object'){return Array.isArray(value)?serializeArray(value):serializeObject(value)}return undefined}function quoteString(value){var quotes={'\'':0.1,'"':0.2};var replacements={'\'':'\\\'','"':'\\"','\\':'\\\\','\b':'\\b','\f':'\\f','\n':'\\n','\r':'\\r','\t':'\\t','\x0B':'\\v','\0':'\\0','\u2028':'\\u2028','\u2029':'\\u2029'};var product='';var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=value[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){var c=_step2.value;switch(c){case'\'':case'"':quotes[c]++;product+=c;continue;}if(replacements[c]){product+=replacements[c];continue}if(c<' '){var hexString=c.charCodeAt(0).toString(16);product+='\\x'+('00'+hexString).substring(hexString.length);continue}product+=c}}catch(err){_didIteratorError2=true;_iteratorError2=err}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return){_iterator2.return()}}finally{if(_didIteratorError2){throw _iteratorError2}}}var quoteChar=quote||Object.keys(quotes).reduce(function(a,b){return quotes[a]<quotes[b]?a:b});product=product.replace(new RegExp(quoteChar,'g'),replacements[quoteChar]);return quoteChar+product+quoteChar}function serializeObject(value){if(stack.indexOf(value)>=0){throw TypeError('Converting circular structure to JSON5')}stack.push(value);var stepback=indent;indent=indent+gap;var keys=propertyList||Object.keys(value);var partial=[];var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=keys[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){var key=_step3.value;var propertyString=serializeProperty(key,value);if(propertyString!==undefined){var member=serializeKey(key)+':';if(gap!==''){member+=' '}member+=propertyString;partial.push(member)}}}catch(err){_didIteratorError3=true;_iteratorError3=err}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return){_iterator3.return()}}finally{if(_didIteratorError3){throw _iteratorError3}}}var final=void 0;if(partial.length===0){final='{}'}else{var properties=void 0;if(gap===''){properties=partial.join(',');final='{'+properties+'}'}else{var separator=',\n'+indent;properties=partial.join(separator);final='{\n'+indent+properties+',\n'+stepback+'}'}}stack.pop();indent=stepback;return final}function serializeKey(key){if(key.length===0){return quoteString(key,true)}var firstChar=String.fromCodePoint(key.codePointAt(0));if(!util.isIdStartChar(firstChar)){return quoteString(key,true)}for(var i=firstChar.length;i<key.length;i++){if(!util.isIdContinueChar(String.fromCodePoint(key.codePointAt(i)))){return quoteString(key,true)}}return key}function serializeArray(value){if(stack.indexOf(value)>=0){throw TypeError('Converting circular structure to JSON5')}stack.push(value);var stepback=indent;indent=indent+gap;var partial=[];for(var i=0;i<value.length;i++){var propertyString=serializeProperty(String(i),value);partial.push(propertyString!==undefined?propertyString:'null')}var final=void 0;if(partial.length===0){final='[]'}else{if(gap===''){var properties=partial.join(',');final='['+properties+']'}else{var separator=',\n'+indent;var _properties=partial.join(separator);final='[\n'+indent+_properties+',\n'+stepback+']'}}stack.pop();indent=stepback;return final}}module.exports=exports['default'];

/***/ }),

/***/ 1927:
/***/ ((__unused_webpack_module, exports) => {

"use strict";
Object.defineProperty(exports, "__esModule", ({value:true}));var Space_Separator=exports.Space_Separator=/[\u1680\u2000-\u200A\u202F\u205F\u3000]/;var ID_Start=exports.ID_Start=/[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/;var ID_Continue=exports.ID_Continue=/[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/;

/***/ }),

/***/ 7393:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
Object.defineProperty(exports, "__esModule", ({value:true}));exports.isSpaceSeparator=isSpaceSeparator;exports.isIdStartChar=isIdStartChar;exports.isIdContinueChar=isIdContinueChar;exports.isDigit=isDigit;exports.isHexDigit=isHexDigit;var _unicode=__webpack_require__(1927);var unicode=_interopRequireWildcard(_unicode);function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))newObj[key]=obj[key]}}newObj.default=obj;return newObj}}function isSpaceSeparator(c){return unicode.Space_Separator.test(c)}function isIdStartChar(c){return c>='a'&&c<='z'||c>='A'&&c<='Z'||c==='$'||c==='_'||unicode.ID_Start.test(c)}function isIdContinueChar(c){return c>='a'&&c<='z'||c>='A'&&c<='Z'||c>='0'&&c<='9'||c==='$'||c==='_'||c==='\u200C'||c==='\u200D'||unicode.ID_Continue.test(c)}function isDigit(c){return /[0-9]/.test(c)}function isHexDigit(c){return /[0-9A-Fa-f]/.test(c)}

/***/ }),

/***/ 6961:
/***/ ((module) => {

var toString = Object.prototype.toString;

module.exports = function kindOf(val) {
  if (val === void 0) return 'undefined';
  if (val === null) return 'null';

  var type = typeof val;
  if (type === 'boolean') return 'boolean';
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'symbol') return 'symbol';
  if (type === 'function') {
    return isGeneratorFn(val) ? 'generatorfunction' : 'function';
  }

  if (isArray(val)) return 'array';
  if (isBuffer(val)) return 'buffer';
  if (isArguments(val)) return 'arguments';
  if (isDate(val)) return 'date';
  if (isError(val)) return 'error';
  if (isRegexp(val)) return 'regexp';

  switch (ctorName(val)) {
    case 'Symbol': return 'symbol';
    case 'Promise': return 'promise';

    // Set, Map, WeakSet, WeakMap
    case 'WeakMap': return 'weakmap';
    case 'WeakSet': return 'weakset';
    case 'Map': return 'map';
    case 'Set': return 'set';

    // 8-bit typed arrays
    case 'Int8Array': return 'int8array';
    case 'Uint8Array': return 'uint8array';
    case 'Uint8ClampedArray': return 'uint8clampedarray';

    // 16-bit typed arrays
    case 'Int16Array': return 'int16array';
    case 'Uint16Array': return 'uint16array';

    // 32-bit typed arrays
    case 'Int32Array': return 'int32array';
    case 'Uint32Array': return 'uint32array';
    case 'Float32Array': return 'float32array';
    case 'Float64Array': return 'float64array';
  }

  if (isGeneratorObj(val)) {
    return 'generator';
  }

  // Non-plain objects
  type = toString.call(val);
  switch (type) {
    case '[object Object]': return 'object';
    // iterators
    case '[object Map Iterator]': return 'mapiterator';
    case '[object Set Iterator]': return 'setiterator';
    case '[object String Iterator]': return 'stringiterator';
    case '[object Array Iterator]': return 'arrayiterator';
  }

  // other
  return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
};

function ctorName(val) {
  return typeof val.constructor === 'function' ? val.constructor.name : null;
}

function isArray(val) {
  if (Array.isArray) return Array.isArray(val);
  return val instanceof Array;
}

function isError(val) {
  return val instanceof Error || (typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number');
}

function isDate(val) {
  if (val instanceof Date) return true;
  return typeof val.toDateString === 'function'
    && typeof val.getDate === 'function'
    && typeof val.setDate === 'function';
}

function isRegexp(val) {
  if (val instanceof RegExp) return true;
  return typeof val.flags === 'string'
    && typeof val.ignoreCase === 'boolean'
    && typeof val.multiline === 'boolean'
    && typeof val.global === 'boolean';
}

function isGeneratorFn(name, val) {
  return ctorName(name) === 'GeneratorFunction';
}

function isGeneratorObj(val) {
  return typeof val.throw === 'function'
    && typeof val.return === 'function'
    && typeof val.next === 'function';
}

function isArguments(val) {
  try {
    if (typeof val.length === 'number' && typeof val.callee === 'function') {
      return true;
    }
  } catch (err) {
    if (err.message.indexOf('callee') !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * If you need to support Safari 5-7 (8-10 yr-old browser),
 * take a look at https://github.com/feross/is-buffer
 */

function isBuffer(val) {
  if (val.constructor && typeof val.constructor.isBuffer === 'function') {
    return val.constructor.isBuffer(val);
  }
  return false;
}


/***/ }),

/***/ 2821:
/***/ ((module) => {

"use strict";


function getCurrentRequest(loaderContext) {
  if (loaderContext.currentRequest) {
    return loaderContext.currentRequest;
  }

  const request = loaderContext.loaders
    .slice(loaderContext.loaderIndex)
    .map((obj) => obj.request)
    .concat([loaderContext.resource]);

  return request.join('!');
}

module.exports = getCurrentRequest;


/***/ }),

/***/ 3567:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const baseEncodeTables = {
  26: 'abcdefghijklmnopqrstuvwxyz',
  32: '123456789abcdefghjkmnpqrstuvwxyz', // no 0lio
  36: '0123456789abcdefghijklmnopqrstuvwxyz',
  49: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', // no lIO
  52: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  58: '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', // no 0lIO
  62: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  64: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_',
};

function encodeBufferToBase(buffer, base) {
  const encodeTable = baseEncodeTables[base];
  if (!encodeTable) {
    throw new Error('Unknown encoding base' + base);
  }

  const readLength = buffer.length;
  const Big = __webpack_require__(8738);

  Big.RM = Big.DP = 0;
  let b = new Big(0);

  for (let i = readLength - 1; i >= 0; i--) {
    b = b.times(256).plus(buffer[i]);
  }

  let output = '';
  while (b.gt(0)) {
    output = encodeTable[b.mod(base)] + output;
    b = b.div(base);
  }

  Big.DP = 20;
  Big.RM = 1;

  return output;
}

function getHashDigest(buffer, hashType, digestType, maxLength) {
  hashType = hashType || 'md5';
  maxLength = maxLength || 9999;

  const hash = __webpack_require__(6417).createHash(hashType);

  hash.update(buffer);

  if (
    digestType === 'base26' ||
    digestType === 'base32' ||
    digestType === 'base36' ||
    digestType === 'base49' ||
    digestType === 'base52' ||
    digestType === 'base58' ||
    digestType === 'base62' ||
    digestType === 'base64'
  ) {
    return encodeBufferToBase(hash.digest(), digestType.substr(4)).substr(
      0,
      maxLength
    );
  } else {
    return hash.digest(digestType || 'hex').substr(0, maxLength);
  }
}

module.exports = getHashDigest;


/***/ }),

/***/ 6445:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const parseQuery = __webpack_require__(5867);

function getOptions(loaderContext) {
  const query = loaderContext.query;

  if (typeof query === 'string' && query !== '') {
    return parseQuery(loaderContext.query);
  }

  if (!query || typeof query !== 'object') {
    // Not object-like queries are not supported.
    return null;
  }

  return query;
}

module.exports = getOptions;


/***/ }),

/***/ 8715:
/***/ ((module) => {

"use strict";


function getRemainingRequest(loaderContext) {
  if (loaderContext.remainingRequest) {
    return loaderContext.remainingRequest;
  }

  const request = loaderContext.loaders
    .slice(loaderContext.loaderIndex + 1)
    .map((obj) => obj.request)
    .concat([loaderContext.resource]);

  return request.join('!');
}

module.exports = getRemainingRequest;


/***/ }),

/***/ 3432:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


const getOptions = __webpack_require__(6445);
const parseQuery = __webpack_require__(5867);
const stringifyRequest = __webpack_require__(4252);
const getRemainingRequest = __webpack_require__(8715);
const getCurrentRequest = __webpack_require__(2821);
const isUrlRequest = __webpack_require__(507);
const urlToRequest = __webpack_require__(2685);
const parseString = __webpack_require__(5784);
const getHashDigest = __webpack_require__(3567);
const interpolateName = __webpack_require__(939);

exports.getOptions = getOptions;
exports.parseQuery = parseQuery;
exports.stringifyRequest = stringifyRequest;
exports.getRemainingRequest = getRemainingRequest;
exports.getCurrentRequest = getCurrentRequest;
exports.isUrlRequest = isUrlRequest;
exports.urlToRequest = urlToRequest;
exports.parseString = parseString;
exports.getHashDigest = getHashDigest;
exports.interpolateName = interpolateName;


/***/ }),

/***/ 939:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const path = __webpack_require__(5622);
const emojisList = __webpack_require__(3887);
const getHashDigest = __webpack_require__(3567);

const emojiRegex = /[\uD800-\uDFFF]./;
const emojiList = emojisList.filter((emoji) => emojiRegex.test(emoji));
const emojiCache = {};

function encodeStringToEmoji(content, length) {
  if (emojiCache[content]) {
    return emojiCache[content];
  }

  length = length || 1;

  const emojis = [];

  do {
    if (!emojiList.length) {
      throw new Error('Ran out of emoji');
    }

    const index = Math.floor(Math.random() * emojiList.length);

    emojis.push(emojiList[index]);
    emojiList.splice(index, 1);
  } while (--length > 0);

  const emojiEncoding = emojis.join('');

  emojiCache[content] = emojiEncoding;

  return emojiEncoding;
}

function interpolateName(loaderContext, name, options) {
  let filename;

  const hasQuery =
    loaderContext.resourceQuery && loaderContext.resourceQuery.length > 1;

  if (typeof name === 'function') {
    filename = name(
      loaderContext.resourcePath,
      hasQuery ? loaderContext.resourceQuery : undefined
    );
  } else {
    filename = name || '[hash].[ext]';
  }

  const context = options.context;
  const content = options.content;
  const regExp = options.regExp;

  let ext = 'bin';
  let basename = 'file';
  let directory = '';
  let folder = '';
  let query = '';

  if (loaderContext.resourcePath) {
    const parsed = path.parse(loaderContext.resourcePath);
    let resourcePath = loaderContext.resourcePath;

    if (parsed.ext) {
      ext = parsed.ext.substr(1);
    }

    if (parsed.dir) {
      basename = parsed.name;
      resourcePath = parsed.dir + path.sep;
    }

    if (typeof context !== 'undefined') {
      directory = path
        .relative(context, resourcePath + '_')
        .replace(/\\/g, '/')
        .replace(/\.\.(\/)?/g, '_$1');
      directory = directory.substr(0, directory.length - 1);
    } else {
      directory = resourcePath.replace(/\\/g, '/').replace(/\.\.(\/)?/g, '_$1');
    }

    if (directory.length === 1) {
      directory = '';
    } else if (directory.length > 1) {
      folder = path.basename(directory);
    }
  }

  if (loaderContext.resourceQuery && loaderContext.resourceQuery.length > 1) {
    query = loaderContext.resourceQuery;

    const hashIdx = query.indexOf('#');

    if (hashIdx >= 0) {
      query = query.substr(0, hashIdx);
    }
  }

  let url = filename;

  if (content) {
    // Match hash template
    url = url
      // `hash` and `contenthash` are same in `loader-utils` context
      // let's keep `hash` for backward compatibility
      .replace(
        /\[(?:([^:\]]+):)?(?:hash|contenthash)(?::([a-z]+\d*))?(?::(\d+))?\]/gi,
        (all, hashType, digestType, maxLength) =>
          getHashDigest(content, hashType, digestType, parseInt(maxLength, 10))
      )
      .replace(/\[emoji(?::(\d+))?\]/gi, (all, length) =>
        encodeStringToEmoji(content, parseInt(length, 10))
      );
  }

  url = url
    .replace(/\[ext\]/gi, () => ext)
    .replace(/\[name\]/gi, () => basename)
    .replace(/\[path\]/gi, () => directory)
    .replace(/\[folder\]/gi, () => folder)
    .replace(/\[query\]/gi, () => query);

  if (regExp && loaderContext.resourcePath) {
    const match = loaderContext.resourcePath.match(new RegExp(regExp));

    match &&
      match.forEach((matched, i) => {
        url = url.replace(new RegExp('\\[' + i + '\\]', 'ig'), matched);
      });
  }

  if (
    typeof loaderContext.options === 'object' &&
    typeof loaderContext.options.customInterpolateName === 'function'
  ) {
    url = loaderContext.options.customInterpolateName.call(
      loaderContext,
      url,
      name,
      options
    );
  }

  return url;
}

module.exports = interpolateName;


/***/ }),

/***/ 507:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const path = __webpack_require__(5622);

function isUrlRequest(url, root) {
  // An URL is not an request if

  // 1. It's an absolute url and it is not `windows` path like `C:\dir\file`
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !path.win32.isAbsolute(url)) {
    return false;
  }

  // 2. It's a protocol-relative
  if (/^\/\//.test(url)) {
    return false;
  }

  // 3. It's some kind of url for a template
  if (/^[{}[\]#*;,'§$%&(=?`´^°<>]/.test(url)) {
    return false;
  }

  // 4. It's also not an request if root isn't set and it's a root-relative url
  if ((root === undefined || root === false) && /^\//.test(url)) {
    return false;
  }

  return true;
}

module.exports = isUrlRequest;


/***/ }),

/***/ 5867:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const JSON5 = __webpack_require__(6904);

const specialValues = {
  null: null,
  true: true,
  false: false,
};

function parseQuery(query) {
  if (query.substr(0, 1) !== '?') {
    throw new Error(
      "A valid query string passed to parseQuery should begin with '?'"
    );
  }

  query = query.substr(1);

  if (!query) {
    return {};
  }

  if (query.substr(0, 1) === '{' && query.substr(-1) === '}') {
    return JSON5.parse(query);
  }

  const queryArgs = query.split(/[,&]/g);
  const result = {};

  queryArgs.forEach((arg) => {
    const idx = arg.indexOf('=');

    if (idx >= 0) {
      let name = arg.substr(0, idx);
      let value = decodeURIComponent(arg.substr(idx + 1));

      if (specialValues.hasOwnProperty(value)) {
        value = specialValues[value];
      }

      if (name.substr(-2) === '[]') {
        name = decodeURIComponent(name.substr(0, name.length - 2));

        if (!Array.isArray(result[name])) {
          result[name] = [];
        }

        result[name].push(value);
      } else {
        name = decodeURIComponent(name);
        result[name] = value;
      }
    } else {
      if (arg.substr(0, 1) === '-') {
        result[decodeURIComponent(arg.substr(1))] = false;
      } else if (arg.substr(0, 1) === '+') {
        result[decodeURIComponent(arg.substr(1))] = true;
      } else {
        result[decodeURIComponent(arg)] = true;
      }
    }
  });

  return result;
}

module.exports = parseQuery;


/***/ }),

/***/ 5784:
/***/ ((module) => {

"use strict";


function parseString(str) {
  try {
    if (str[0] === '"') {
      return JSON.parse(str);
    }

    if (str[0] === "'" && str.substr(str.length - 1) === "'") {
      return parseString(
        str
          .replace(/\\.|"/g, (x) => (x === '"' ? '\\"' : x))
          .replace(/^'|'$/g, '"')
      );
    }

    return JSON.parse('"' + str + '"');
  } catch (e) {
    return str;
  }
}

module.exports = parseString;


/***/ }),

/***/ 4252:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const path = __webpack_require__(5622);

const matchRelativePath = /^\.\.?[/\\]/;

function isAbsolutePath(str) {
  return path.posix.isAbsolute(str) || path.win32.isAbsolute(str);
}

function isRelativePath(str) {
  return matchRelativePath.test(str);
}

function stringifyRequest(loaderContext, request) {
  const splitted = request.split('!');
  const context =
    loaderContext.context ||
    (loaderContext.options && loaderContext.options.context);

  return JSON.stringify(
    splitted
      .map((part) => {
        // First, separate singlePath from query, because the query might contain paths again
        const splittedPart = part.match(/^(.*?)(\?.*)/);
        const query = splittedPart ? splittedPart[2] : '';
        let singlePath = splittedPart ? splittedPart[1] : part;

        if (isAbsolutePath(singlePath) && context) {
          singlePath = path.relative(context, singlePath);

          if (isAbsolutePath(singlePath)) {
            // If singlePath still matches an absolute path, singlePath was on a different drive than context.
            // In this case, we leave the path platform-specific without replacing any separators.
            // @see https://github.com/webpack/loader-utils/pull/14
            return singlePath + query;
          }

          if (isRelativePath(singlePath) === false) {
            // Ensure that the relative path starts at least with ./ otherwise it would be a request into the modules directory (like node_modules).
            singlePath = './' + singlePath;
          }
        }

        return singlePath.replace(/\\/g, '/') + query;
      })
      .join('!')
  );
}

module.exports = stringifyRequest;


/***/ }),

/***/ 2685:
/***/ ((module) => {

"use strict";


// we can't use path.win32.isAbsolute because it also matches paths starting with a forward slash
const matchNativeWin32Path = /^[A-Z]:[/\\]|^\\\\/i;

function urlToRequest(url, root) {
  // Do not rewrite an empty url
  if (url === '') {
    return '';
  }

  const moduleRequestRegex = /^[^?]*~/;
  let request;

  if (matchNativeWin32Path.test(url)) {
    // absolute windows path, keep it
    request = url;
  } else if (root !== undefined && root !== false && /^\//.test(url)) {
    // if root is set and the url is root-relative
    switch (typeof root) {
      // 1. root is a string: root is prefixed to the url
      case 'string':
        // special case: `~` roots convert to module request
        if (moduleRequestRegex.test(root)) {
          request = root.replace(/([^~/])$/, '$1/') + url.slice(1);
        } else {
          request = root + url;
        }
        break;
      // 2. root is `true`: absolute paths are allowed
      //    *nix only, windows-style absolute paths are always allowed as they doesn't start with a `/`
      case 'boolean':
        request = url;
        break;
      default:
        throw new Error(
          "Unexpected parameters to loader-utils 'urlToRequest': url = " +
            url +
            ', root = ' +
            root +
            '.'
        );
    }
  } else if (/^\.\.?\//.test(url)) {
    // A relative url stays
    request = url;
  } else {
    // every other url is threaded like a relative url
    request = './' + url;
  }

  // A `~` makes the url an module
  if (moduleRequestRegex.test(request)) {
    request = request.replace(moduleRequestRegex, '');
  }

  return request;
}

module.exports = urlToRequest;


/***/ }),

/***/ 1857:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(4479),
    root = __webpack_require__(9882);

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView');

module.exports = DataView;


/***/ }),

/***/ 5902:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var hashClear = __webpack_require__(1789),
    hashDelete = __webpack_require__(712),
    hashGet = __webpack_require__(5395),
    hashHas = __webpack_require__(5232),
    hashSet = __webpack_require__(7320);

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

module.exports = Hash;


/***/ }),

/***/ 6608:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var listCacheClear = __webpack_require__(9792),
    listCacheDelete = __webpack_require__(7716),
    listCacheGet = __webpack_require__(5789),
    listCacheHas = __webpack_require__(9386),
    listCacheSet = __webpack_require__(7399);

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

module.exports = ListCache;


/***/ }),

/***/ 881:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(4479),
    root = __webpack_require__(9882);

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;


/***/ }),

/***/ 938:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var mapCacheClear = __webpack_require__(1610),
    mapCacheDelete = __webpack_require__(6657),
    mapCacheGet = __webpack_require__(1372),
    mapCacheHas = __webpack_require__(609),
    mapCacheSet = __webpack_require__(5582);

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

module.exports = MapCache;


/***/ }),

/***/ 4671:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(4479),
    root = __webpack_require__(9882);

/* Built-in method references that are verified to be native. */
var Promise = getNative(root, 'Promise');

module.exports = Promise;


/***/ }),

/***/ 5793:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(4479),
    root = __webpack_require__(9882);

/* Built-in method references that are verified to be native. */
var Set = getNative(root, 'Set');

module.exports = Set;


/***/ }),

/***/ 5323:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var ListCache = __webpack_require__(6608),
    stackClear = __webpack_require__(2843),
    stackDelete = __webpack_require__(4717),
    stackGet = __webpack_require__(21),
    stackHas = __webpack_require__(3910),
    stackSet = __webpack_require__(9955);

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

module.exports = Stack;


/***/ }),

/***/ 9213:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var root = __webpack_require__(9882);

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;


/***/ }),

/***/ 3261:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var root = __webpack_require__(9882);

/** Built-in value references. */
var Uint8Array = root.Uint8Array;

module.exports = Uint8Array;


/***/ }),

/***/ 3915:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(4479),
    root = __webpack_require__(9882);

/* Built-in method references that are verified to be native. */
var WeakMap = getNative(root, 'WeakMap');

module.exports = WeakMap;


/***/ }),

/***/ 9647:
/***/ ((module) => {

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

module.exports = apply;


/***/ }),

/***/ 8403:
/***/ ((module) => {

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;


/***/ }),

/***/ 8388:
/***/ ((module) => {

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

module.exports = arrayFilter;


/***/ }),

/***/ 2237:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseTimes = __webpack_require__(7765),
    isArguments = __webpack_require__(8495),
    isArray = __webpack_require__(4869),
    isBuffer = __webpack_require__(4190),
    isIndex = __webpack_require__(2936),
    isTypedArray = __webpack_require__(2496);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = arrayLikeKeys;


/***/ }),

/***/ 82:
/***/ ((module) => {

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

module.exports = arrayPush;


/***/ }),

/***/ 9725:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseAssignValue = __webpack_require__(3868),
    eq = __webpack_require__(1901);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

module.exports = assignValue;


/***/ }),

/***/ 6752:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var eq = __webpack_require__(1901);

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

module.exports = assocIndexOf;


/***/ }),

/***/ 1368:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var copyObject = __webpack_require__(6388),
    keys = __webpack_require__(7645);

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && copyObject(source, keys(source), object);
}

module.exports = baseAssign;


/***/ }),

/***/ 428:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var copyObject = __webpack_require__(6388),
    keysIn = __webpack_require__(9109);

/**
 * The base implementation of `_.assignIn` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssignIn(object, source) {
  return object && copyObject(source, keysIn(source), object);
}

module.exports = baseAssignIn;


/***/ }),

/***/ 3868:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var defineProperty = __webpack_require__(416);

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

module.exports = baseAssignValue;


/***/ }),

/***/ 3040:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Stack = __webpack_require__(5323),
    arrayEach = __webpack_require__(8403),
    assignValue = __webpack_require__(9725),
    baseAssign = __webpack_require__(1368),
    baseAssignIn = __webpack_require__(428),
    cloneBuffer = __webpack_require__(2974),
    copyArray = __webpack_require__(5157),
    copySymbols = __webpack_require__(6631),
    copySymbolsIn = __webpack_require__(1136),
    getAllKeys = __webpack_require__(8009),
    getAllKeysIn = __webpack_require__(4291),
    getTag = __webpack_require__(941),
    initCloneArray = __webpack_require__(9763),
    initCloneByTag = __webpack_require__(6501),
    initCloneObject = __webpack_require__(1532),
    isArray = __webpack_require__(4869),
    isBuffer = __webpack_require__(4190),
    isMap = __webpack_require__(9718),
    isObject = __webpack_require__(3334),
    isSet = __webpack_require__(8371),
    keys = __webpack_require__(7645),
    keysIn = __webpack_require__(9109);

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_FLAT_FLAG = 2,
    CLONE_SYMBOLS_FLAG = 4;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
cloneableTags[boolTag] = cloneableTags[dateTag] =
cloneableTags[float32Tag] = cloneableTags[float64Tag] =
cloneableTags[int8Tag] = cloneableTags[int16Tag] =
cloneableTags[int32Tag] = cloneableTags[mapTag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[setTag] =
cloneableTags[stringTag] = cloneableTags[symbolTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[weakMapTag] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result,
      isDeep = bitmask & CLONE_DEEP_FLAG,
      isFlat = bitmask & CLONE_FLAT_FLAG,
      isFull = bitmask & CLONE_SYMBOLS_FLAG;

  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return copyArray(value, result);
    }
  } else {
    var tag = getTag(value),
        isFunc = tag == funcTag || tag == genTag;

    if (isBuffer(value)) {
      return cloneBuffer(value, isDeep);
    }
    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = (isFlat || isFunc) ? {} : initCloneObject(value);
      if (!isDeep) {
        return isFlat
          ? copySymbolsIn(value, baseAssignIn(result, value))
          : copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag(value, tag, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new Stack);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (isSet(value)) {
    value.forEach(function(subValue) {
      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
    });
  } else if (isMap(value)) {
    value.forEach(function(subValue, key) {
      result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
    });
  }

  var keysFunc = isFull
    ? (isFlat ? getAllKeysIn : getAllKeys)
    : (isFlat ? keysIn : keys);

  var props = isArr ? undefined : keysFunc(value);
  arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
  });
  return result;
}

module.exports = baseClone;


/***/ }),

/***/ 6706:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(3334);

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

module.exports = baseCreate;


/***/ }),

/***/ 5951:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var arrayPush = __webpack_require__(82),
    isArray = __webpack_require__(4869);

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

module.exports = baseGetAllKeys;


/***/ }),

/***/ 7497:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Symbol = __webpack_require__(9213),
    getRawTag = __webpack_require__(923),
    objectToString = __webpack_require__(4200);

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

module.exports = baseGetTag;


/***/ }),

/***/ 2177:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseGetTag = __webpack_require__(7497),
    isObjectLike = __webpack_require__(5926);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

module.exports = baseIsArguments;


/***/ }),

/***/ 6372:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getTag = __webpack_require__(941),
    isObjectLike = __webpack_require__(5926);

/** `Object#toString` result references. */
var mapTag = '[object Map]';

/**
 * The base implementation of `_.isMap` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 */
function baseIsMap(value) {
  return isObjectLike(value) && getTag(value) == mapTag;
}

module.exports = baseIsMap;


/***/ }),

/***/ 411:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isFunction = __webpack_require__(7799),
    isMasked = __webpack_require__(9058),
    isObject = __webpack_require__(3334),
    toSource = __webpack_require__(6928);

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = baseIsNative;


/***/ }),

/***/ 3688:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getTag = __webpack_require__(941),
    isObjectLike = __webpack_require__(5926);

/** `Object#toString` result references. */
var setTag = '[object Set]';

/**
 * The base implementation of `_.isSet` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 */
function baseIsSet(value) {
  return isObjectLike(value) && getTag(value) == setTag;
}

module.exports = baseIsSet;


/***/ }),

/***/ 1528:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseGetTag = __webpack_require__(7497),
    isLength = __webpack_require__(4530),
    isObjectLike = __webpack_require__(5926);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

module.exports = baseIsTypedArray;


/***/ }),

/***/ 7164:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isPrototype = __webpack_require__(10),
    nativeKeys = __webpack_require__(5778);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

module.exports = baseKeys;


/***/ }),

/***/ 297:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(3334),
    isPrototype = __webpack_require__(10),
    nativeKeysIn = __webpack_require__(5383);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = baseKeysIn;


/***/ }),

/***/ 5979:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var identity = __webpack_require__(7822),
    overRest = __webpack_require__(2417),
    setToString = __webpack_require__(8416);

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return setToString(overRest(func, start, identity), func + '');
}

module.exports = baseRest;


/***/ }),

/***/ 979:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var constant = __webpack_require__(5946),
    defineProperty = __webpack_require__(416),
    identity = __webpack_require__(7822);

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !defineProperty ? identity : function(func, string) {
  return defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant(string),
    'writable': true
  });
};

module.exports = baseSetToString;


/***/ }),

/***/ 7765:
/***/ ((module) => {

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

module.exports = baseTimes;


/***/ }),

/***/ 9258:
/***/ ((module) => {

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

module.exports = baseUnary;


/***/ }),

/***/ 1094:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Uint8Array = __webpack_require__(3261);

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

module.exports = cloneArrayBuffer;


/***/ }),

/***/ 2974:
/***/ ((module, exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);
var root = __webpack_require__(9882);

/** Detect free variable `exports`. */
var freeExports =  true && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && "object" == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

module.exports = cloneBuffer;


/***/ }),

/***/ 4524:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var cloneArrayBuffer = __webpack_require__(1094);

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

module.exports = cloneDataView;


/***/ }),

/***/ 6497:
/***/ ((module) => {

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

module.exports = cloneRegExp;


/***/ }),

/***/ 8035:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Symbol = __webpack_require__(9213);

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

module.exports = cloneSymbol;


/***/ }),

/***/ 7764:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var cloneArrayBuffer = __webpack_require__(1094);

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

module.exports = cloneTypedArray;


/***/ }),

/***/ 5157:
/***/ ((module) => {

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = copyArray;


/***/ }),

/***/ 6388:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var assignValue = __webpack_require__(9725),
    baseAssignValue = __webpack_require__(3868);

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}

module.exports = copyObject;


/***/ }),

/***/ 6631:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var copyObject = __webpack_require__(6388),
    getSymbols = __webpack_require__(6802);

/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return copyObject(source, getSymbols(source), object);
}

module.exports = copySymbols;


/***/ }),

/***/ 1136:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var copyObject = __webpack_require__(6388),
    getSymbolsIn = __webpack_require__(443);

/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn(source, object) {
  return copyObject(source, getSymbolsIn(source), object);
}

module.exports = copySymbolsIn;


/***/ }),

/***/ 8380:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var root = __webpack_require__(9882);

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

module.exports = coreJsData;


/***/ }),

/***/ 1911:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseRest = __webpack_require__(5979),
    isIterateeCall = __webpack_require__(8494);

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;


/***/ }),

/***/ 416:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(4479);

var defineProperty = (function() {
  try {
    var func = getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

module.exports = defineProperty;


/***/ }),

/***/ 2085:
/***/ ((module) => {

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;


/***/ }),

/***/ 8009:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseGetAllKeys = __webpack_require__(5951),
    getSymbols = __webpack_require__(6802),
    keys = __webpack_require__(7645);

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

module.exports = getAllKeys;


/***/ }),

/***/ 4291:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseGetAllKeys = __webpack_require__(5951),
    getSymbolsIn = __webpack_require__(443),
    keysIn = __webpack_require__(9109);

/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn(object) {
  return baseGetAllKeys(object, keysIn, getSymbolsIn);
}

module.exports = getAllKeysIn;


/***/ }),

/***/ 9980:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isKeyable = __webpack_require__(3308);

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

module.exports = getMapData;


/***/ }),

/***/ 4479:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseIsNative = __webpack_require__(411),
    getValue = __webpack_require__(3542);

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

module.exports = getNative;


/***/ }),

/***/ 6271:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var overArg = __webpack_require__(6320);

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

module.exports = getPrototype;


/***/ }),

/***/ 923:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Symbol = __webpack_require__(9213);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;


/***/ }),

/***/ 6802:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var arrayFilter = __webpack_require__(8388),
    stubArray = __webpack_require__(8634);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

module.exports = getSymbols;


/***/ }),

/***/ 443:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var arrayPush = __webpack_require__(82),
    getPrototype = __webpack_require__(6271),
    getSymbols = __webpack_require__(6802),
    stubArray = __webpack_require__(8634);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
  var result = [];
  while (object) {
    arrayPush(result, getSymbols(object));
    object = getPrototype(object);
  }
  return result;
};

module.exports = getSymbolsIn;


/***/ }),

/***/ 941:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DataView = __webpack_require__(1857),
    Map = __webpack_require__(881),
    Promise = __webpack_require__(4671),
    Set = __webpack_require__(5793),
    WeakMap = __webpack_require__(3915),
    baseGetTag = __webpack_require__(7497),
    toSource = __webpack_require__(6928);

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    setTag = '[object Set]',
    weakMapTag = '[object WeakMap]';

var dataViewTag = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = baseGetTag(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

module.exports = getTag;


/***/ }),

/***/ 3542:
/***/ ((module) => {

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

module.exports = getValue;


/***/ }),

/***/ 1789:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var nativeCreate = __webpack_require__(3041);

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

module.exports = hashClear;


/***/ }),

/***/ 712:
/***/ ((module) => {

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = hashDelete;


/***/ }),

/***/ 5395:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var nativeCreate = __webpack_require__(3041);

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

module.exports = hashGet;


/***/ }),

/***/ 5232:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var nativeCreate = __webpack_require__(3041);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

module.exports = hashHas;


/***/ }),

/***/ 7320:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var nativeCreate = __webpack_require__(3041);

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

module.exports = hashSet;


/***/ }),

/***/ 9763:
/***/ ((module) => {

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

module.exports = initCloneArray;


/***/ }),

/***/ 6501:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var cloneArrayBuffer = __webpack_require__(1094),
    cloneDataView = __webpack_require__(4524),
    cloneRegExp = __webpack_require__(6497),
    cloneSymbol = __webpack_require__(8035),
    cloneTypedArray = __webpack_require__(7764);

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return cloneArrayBuffer(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case dataViewTag:
      return cloneDataView(object, isDeep);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      return cloneTypedArray(object, isDeep);

    case mapTag:
      return new Ctor;

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      return cloneRegExp(object);

    case setTag:
      return new Ctor;

    case symbolTag:
      return cloneSymbol(object);
  }
}

module.exports = initCloneByTag;


/***/ }),

/***/ 1532:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseCreate = __webpack_require__(6706),
    getPrototype = __webpack_require__(6271),
    isPrototype = __webpack_require__(10);

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

module.exports = initCloneObject;


/***/ }),

/***/ 2936:
/***/ ((module) => {

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

module.exports = isIndex;


/***/ }),

/***/ 8494:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var eq = __webpack_require__(1901),
    isArrayLike = __webpack_require__(8017),
    isIndex = __webpack_require__(2936),
    isObject = __webpack_require__(3334);

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike(object) && isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq(object[index], value);
  }
  return false;
}

module.exports = isIterateeCall;


/***/ }),

/***/ 3308:
/***/ ((module) => {

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

module.exports = isKeyable;


/***/ }),

/***/ 9058:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var coreJsData = __webpack_require__(8380);

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

module.exports = isMasked;


/***/ }),

/***/ 10:
/***/ ((module) => {

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

module.exports = isPrototype;


/***/ }),

/***/ 9792:
/***/ ((module) => {

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

module.exports = listCacheClear;


/***/ }),

/***/ 7716:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var assocIndexOf = __webpack_require__(6752);

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

module.exports = listCacheDelete;


/***/ }),

/***/ 5789:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var assocIndexOf = __webpack_require__(6752);

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

module.exports = listCacheGet;


/***/ }),

/***/ 9386:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var assocIndexOf = __webpack_require__(6752);

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

module.exports = listCacheHas;


/***/ }),

/***/ 7399:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var assocIndexOf = __webpack_require__(6752);

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

module.exports = listCacheSet;


/***/ }),

/***/ 1610:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Hash = __webpack_require__(5902),
    ListCache = __webpack_require__(6608),
    Map = __webpack_require__(881);

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

module.exports = mapCacheClear;


/***/ }),

/***/ 6657:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getMapData = __webpack_require__(9980);

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = mapCacheDelete;


/***/ }),

/***/ 1372:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getMapData = __webpack_require__(9980);

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

module.exports = mapCacheGet;


/***/ }),

/***/ 609:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getMapData = __webpack_require__(9980);

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

module.exports = mapCacheHas;


/***/ }),

/***/ 5582:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getMapData = __webpack_require__(9980);

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

module.exports = mapCacheSet;


/***/ }),

/***/ 3041:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(4479);

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

module.exports = nativeCreate;


/***/ }),

/***/ 5778:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var overArg = __webpack_require__(6320);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

module.exports = nativeKeys;


/***/ }),

/***/ 5383:
/***/ ((module) => {

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = nativeKeysIn;


/***/ }),

/***/ 4643:
/***/ ((module, exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);
var freeGlobal = __webpack_require__(2085);

/** Detect free variable `exports`. */
var freeExports =  true && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && "object" == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule && freeModule.require && freeModule.require('util').types;

    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;


/***/ }),

/***/ 4200:
/***/ ((module) => {

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;


/***/ }),

/***/ 6320:
/***/ ((module) => {

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

module.exports = overArg;


/***/ }),

/***/ 2417:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var apply = __webpack_require__(9647);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply(func, this, otherArgs);
  };
}

module.exports = overRest;


/***/ }),

/***/ 9882:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var freeGlobal = __webpack_require__(2085);

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;


/***/ }),

/***/ 8416:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseSetToString = __webpack_require__(979),
    shortOut = __webpack_require__(7882);

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = shortOut(baseSetToString);

module.exports = setToString;


/***/ }),

/***/ 7882:
/***/ ((module) => {

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

module.exports = shortOut;


/***/ }),

/***/ 2843:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var ListCache = __webpack_require__(6608);

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

module.exports = stackClear;


/***/ }),

/***/ 4717:
/***/ ((module) => {

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

module.exports = stackDelete;


/***/ }),

/***/ 21:
/***/ ((module) => {

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

module.exports = stackGet;


/***/ }),

/***/ 3910:
/***/ ((module) => {

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

module.exports = stackHas;


/***/ }),

/***/ 9955:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var ListCache = __webpack_require__(6608),
    Map = __webpack_require__(881),
    MapCache = __webpack_require__(938);

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

module.exports = stackSet;


/***/ }),

/***/ 6928:
/***/ ((module) => {

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

module.exports = toSource;


/***/ }),

/***/ 4874:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var assignValue = __webpack_require__(9725),
    copyObject = __webpack_require__(6388),
    createAssigner = __webpack_require__(1911),
    isArrayLike = __webpack_require__(8017),
    isPrototype = __webpack_require__(10),
    keys = __webpack_require__(7645);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns own enumerable string keyed properties of source objects to the
 * destination object. Source objects are applied from left to right.
 * Subsequent sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object` and is loosely based on
 * [`Object.assign`](https://mdn.io/Object/assign).
 *
 * @static
 * @memberOf _
 * @since 0.10.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.assignIn
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * function Bar() {
 *   this.c = 3;
 * }
 *
 * Foo.prototype.b = 2;
 * Bar.prototype.d = 4;
 *
 * _.assign({ 'a': 0 }, new Foo, new Bar);
 * // => { 'a': 1, 'c': 3 }
 */
var assign = createAssigner(function(object, source) {
  if (isPrototype(source) || isArrayLike(source)) {
    copyObject(source, keys(source), object);
    return;
  }
  for (var key in source) {
    if (hasOwnProperty.call(source, key)) {
      assignValue(object, key, source[key]);
    }
  }
});

module.exports = assign;


/***/ }),

/***/ 2187:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseClone = __webpack_require__(3040);

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_SYMBOLS_FLAG = 4;

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see _.clone
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep(value) {
  return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
}

module.exports = cloneDeep;


/***/ }),

/***/ 5946:
/***/ ((module) => {

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

module.exports = constant;


/***/ }),

/***/ 1901:
/***/ ((module) => {

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

module.exports = eq;


/***/ }),

/***/ 7822:
/***/ ((module) => {

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;


/***/ }),

/***/ 8495:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseIsArguments = __webpack_require__(2177),
    isObjectLike = __webpack_require__(5926);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

module.exports = isArguments;


/***/ }),

/***/ 4869:
/***/ ((module) => {

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

module.exports = isArray;


/***/ }),

/***/ 8017:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isFunction = __webpack_require__(7799),
    isLength = __webpack_require__(4530);

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

module.exports = isArrayLike;


/***/ }),

/***/ 4190:
/***/ ((module, exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);
var root = __webpack_require__(9882),
    stubFalse = __webpack_require__(7744);

/** Detect free variable `exports`. */
var freeExports =  true && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && "object" == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

module.exports = isBuffer;


/***/ }),

/***/ 7799:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseGetTag = __webpack_require__(7497),
    isObject = __webpack_require__(3334);

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

module.exports = isFunction;


/***/ }),

/***/ 4530:
/***/ ((module) => {

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;


/***/ }),

/***/ 9718:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseIsMap = __webpack_require__(6372),
    baseUnary = __webpack_require__(9258),
    nodeUtil = __webpack_require__(4643);

/* Node.js helper references. */
var nodeIsMap = nodeUtil && nodeUtil.isMap;

/**
 * Checks if `value` is classified as a `Map` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 * @example
 *
 * _.isMap(new Map);
 * // => true
 *
 * _.isMap(new WeakMap);
 * // => false
 */
var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;

module.exports = isMap;


/***/ }),

/***/ 3334:
/***/ ((module) => {

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;


/***/ }),

/***/ 5926:
/***/ ((module) => {

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

module.exports = isObjectLike;


/***/ }),

/***/ 8371:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseIsSet = __webpack_require__(3688),
    baseUnary = __webpack_require__(9258),
    nodeUtil = __webpack_require__(4643);

/* Node.js helper references. */
var nodeIsSet = nodeUtil && nodeUtil.isSet;

/**
 * Checks if `value` is classified as a `Set` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 * @example
 *
 * _.isSet(new Set);
 * // => true
 *
 * _.isSet(new WeakSet);
 * // => false
 */
var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;

module.exports = isSet;


/***/ }),

/***/ 2496:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseIsTypedArray = __webpack_require__(1528),
    baseUnary = __webpack_require__(9258),
    nodeUtil = __webpack_require__(4643);

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

module.exports = isTypedArray;


/***/ }),

/***/ 7645:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var arrayLikeKeys = __webpack_require__(2237),
    baseKeys = __webpack_require__(7164),
    isArrayLike = __webpack_require__(8017);

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

module.exports = keys;


/***/ }),

/***/ 9109:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var arrayLikeKeys = __webpack_require__(2237),
    baseKeysIn = __webpack_require__(297),
    isArrayLike = __webpack_require__(8017);

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

module.exports = keysIn;


/***/ }),

/***/ 8634:
/***/ ((module) => {

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

module.exports = stubArray;


/***/ }),

/***/ 7744:
/***/ ((module) => {

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = stubFalse;


/***/ }),

/***/ 3973:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = minimatch
minimatch.Minimatch = Minimatch

var path = { sep: '/' }
try {
  path = __webpack_require__(5622)
} catch (er) {}

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {}
var expand = __webpack_require__(3717)

var plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
}

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]'

// * => any number of characters
var star = qmark + '*?'

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?'

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?'

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!')

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/

minimatch.filter = filter
function filter (pattern, options) {
  options = options || {}
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  a = a || {}
  b = b || {}
  var t = {}
  Object.keys(b).forEach(function (k) {
    t[k] = b[k]
  })
  Object.keys(a).forEach(function (k) {
    t[k] = a[k]
  })
  return t
}

minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return minimatch

  var orig = minimatch

  var m = function minimatch (p, pattern, options) {
    return orig.minimatch(p, pattern, ext(def, options))
  }

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  }

  return m
}

Minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return Minimatch
  return minimatch.defaults(def).Minimatch
}

function minimatch (p, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  // "" only matches ""
  if (pattern.trim() === '') return p === ''

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}
  pattern = pattern.trim()

  // windows support: need to use /, not \
  if (path.sep !== '/') {
    pattern = pattern.split(path.sep).join('/')
  }

  this.options = options
  this.set = []
  this.pattern = pattern
  this.regexp = null
  this.negate = false
  this.comment = false
  this.empty = false

  // make the set of regexps etc.
  this.make()
}

Minimatch.prototype.debug = function () {}

Minimatch.prototype.make = make
function make () {
  // don't do it more than once.
  if (this._made) return

  var pattern = this.pattern
  var options = this.options

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true
    return
  }
  if (!pattern) {
    this.empty = true
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate()

  // step 2: expand braces
  var set = this.globSet = this.braceExpand()

  if (options.debug) this.debug = console.error

  this.debug(this.pattern, set)

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  })

  this.debug(this.pattern, set)

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this)

  this.debug(this.pattern, set)

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  })

  this.debug(this.pattern, set)

  this.set = set
}

Minimatch.prototype.parseNegate = parseNegate
function parseNegate () {
  var pattern = this.pattern
  var negate = false
  var options = this.options
  var negateOffset = 0

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate
    negateOffset++
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset)
  this.negate = negate
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
}

Minimatch.prototype.braceExpand = braceExpand

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options
    } else {
      options = {}
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern

  if (typeof pattern === 'undefined') {
    throw new TypeError('undefined pattern')
  }

  if (options.nobrace ||
    !pattern.match(/\{.*\}/)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse
var SUBPARSE = {}
function parse (pattern, isSub) {
  if (pattern.length > 1024 * 64) {
    throw new TypeError('pattern is too long')
  }

  var options = this.options

  // shortcuts
  if (!options.noglobstar && pattern === '**') return GLOBSTAR
  if (pattern === '') return ''

  var re = ''
  var hasMagic = !!options.nocase
  var escaping = false
  // ? => one single character
  var patternListStack = []
  var negativeLists = []
  var stateChar
  var inClass = false
  var reClassStart = -1
  var classStart = -1
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)'
  var self = this

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star
          hasMagic = true
        break
        case '?':
          re += qmark
          hasMagic = true
        break
        default:
          re += '\\' + stateChar
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re)
      stateChar = false
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c)

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c
      escaping = false
      continue
    }

    switch (c) {
      case '/':
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false

      case '\\':
        clearStateChar()
        escaping = true
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c)

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class')
          if (c === '!' && i === classStart + 1) c = '^'
          re += c
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar)
        clearStateChar()
        stateChar = c
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar()
      continue

      case '(':
        if (inClass) {
          re += '('
          continue
        }

        if (!stateChar) {
          re += '\\('
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        })
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:'
        this.debug('plType %j %j', stateChar, re)
        stateChar = false
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)'
          continue
        }

        clearStateChar()
        hasMagic = true
        var pl = patternListStack.pop()
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close
        if (pl.type === '!') {
          negativeLists.push(pl)
        }
        pl.reEnd = re.length
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|'
          escaping = false
          continue
        }

        clearStateChar()
        re += '|'
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar()

        if (inClass) {
          re += '\\' + c
          continue
        }

        inClass = true
        classStart = i
        reClassStart = re.length
        re += c
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c
          escaping = false
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        if (inClass) {
          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          var cs = pattern.substring(classStart + 1, i)
          try {
            RegExp('[' + cs + ']')
          } catch (er) {
            // not a valid class!
            var sp = this.parse(cs, SUBPARSE)
            re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]'
            hasMagic = hasMagic || sp[1]
            inClass = false
            continue
          }
        }

        // finish up the class.
        hasMagic = true
        inClass = false
        re += c
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar()

        if (escaping) {
          // no need
          escaping = false
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\'
        }

        re += c

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1)
    sp = this.parse(cs, SUBPARSE)
    re = re.substr(0, reClassStart) + '\\[' + sp[0]
    hasMagic = hasMagic || sp[1]
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length)
    this.debug('setting tail', re, pl)
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\'
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    })

    this.debug('tail=%j\n   %s', tail, tail, pl, re)
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type

    hasMagic = true
    re = re.slice(0, pl.reStart) + t + '\\(' + tail
  }

  // handle trailing things that only matter at the very end.
  clearStateChar()
  if (escaping) {
    // trailing \\
    re += '\\\\'
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false
  switch (re.charAt(0)) {
    case '.':
    case '[':
    case '(': addPatternStart = true
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n]

    var nlBefore = re.slice(0, nl.reStart)
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8)
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd)
    var nlAfter = re.slice(nl.reEnd)

    nlLast += nlAfter

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1
    var cleanAfter = nlAfter
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '')
    }
    nlAfter = cleanAfter

    var dollar = ''
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$'
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast
    re = newRe
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re
  }

  if (addPatternStart) {
    re = patternStart + re
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : ''
  try {
    var regExp = new RegExp('^' + re + '$', flags)
  } catch (er) {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern
  regExp._src = re

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
}

Minimatch.prototype.makeRe = makeRe
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set

  if (!set.length) {
    this.regexp = false
    return this.regexp
  }
  var options = this.options

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot
  var flags = options.nocase ? 'i' : ''

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|')

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$'

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$'

  try {
    this.regexp = new RegExp(re, flags)
  } catch (ex) {
    this.regexp = false
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {}
  var mm = new Minimatch(pattern, options)
  list = list.filter(function (f) {
    return mm.match(f)
  })
  if (mm.options.nonull && !list.length) {
    list.push(pattern)
  }
  return list
}

Minimatch.prototype.match = match
function match (f, partial) {
  this.debug('match', f, this.pattern)
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options

  // windows: need to use /, not \
  if (path.sep !== '/') {
    f = f.split(path.sep).join('/')
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit)
  this.debug(this.pattern, 'split', f)

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set
  this.debug(this.pattern, 'set', set)

  // Find the basename of the path by looking for the last non-empty segment
  var filename
  var i
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i]
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i]
    var file = f
    if (options.matchBase && pattern.length === 1) {
      file = [filename]
    }
    var hit = this.matchOne(file, pattern, partial)
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern })

  this.debug('matchOne', file.length, pattern.length)

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop')
    var p = pattern[pi]
    var f = file[fi]

    this.debug(pattern, p, f)

    // should be impossible.
    // some invalid regexp stuff in the set.
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f])

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi
      var pr = pi + 1
      if (pr === pl) {
        this.debug('** at the end')
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr]

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee)

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee)
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr)
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue')
          fr++
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr)
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit
    if (typeof p === 'string') {
      if (options.nocase) {
        hit = f.toLowerCase() === p.toLowerCase()
      } else {
        hit = f === p
      }
      this.debug('string match', p, f, hit)
    } else {
      hit = f.match(p)
      this.debug('pattern match', p, f, hit)
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    var emptyFileEnd = (fi === fl - 1) && (file[fi] === '')
    return emptyFileEnd
  }

  // should be unreachable.
  throw new Error('wtf?')
}

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}


/***/ }),

/***/ 6186:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var path = __webpack_require__(5622);
var fs = __webpack_require__(5747);
var _0777 = parseInt('0777', 8);

module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

function mkdirP (p, opts, f, made) {
    if (typeof opts === 'function') {
        f = opts;
        opts = {};
    }
    else if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs;
    
    if (mode === undefined) {
        mode = _0777
    }
    if (!made) made = null;
    
    var cb = f || function () {};
    p = path.resolve(p);
    
    xfs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                if (path.dirname(p) === p) return cb(er);
                mkdirP(path.dirname(p), opts, function (er, made) {
                    if (er) cb(er, made);
                    else mkdirP(p, opts, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                xfs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made)
                    else cb(null, made);
                });
                break;
        }
    });
}

mkdirP.sync = function sync (p, opts, made) {
    if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs;
    
    if (mode === undefined) {
        mode = _0777
    }
    if (!made) made = null;

    p = path.resolve(p);

    try {
        xfs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = sync(path.dirname(p), opts, made);
                sync(p, opts, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = xfs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
};


/***/ }),

/***/ 117:
/***/ (function(__unused_webpack_module, exports) {

(function(global, factory) {
  /*jshint -W030 */
  'use strict';
   true
    ? factory(exports)
    : 0;
})(this, function(exports) {
  'use strict';

  var noop = function noop() {};
  var throwError = function throwError() {
    throw new Error('Callback was already called.');
  };

  var DEFAULT_TIMES = 5;
  var DEFAULT_INTERVAL = 0;

  var obj = 'object';
  var func = 'function';
  var isArray = Array.isArray;
  var nativeKeys = Object.keys;
  var nativePush = Array.prototype.push;
  var iteratorSymbol = typeof Symbol === func && Symbol.iterator;

  var nextTick, asyncNextTick, asyncSetImmediate;
  createImmediate();

  /**
   * @memberof async
   * @namespace each
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.each(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done();
   *   }, num * 10);
   * };
   * async.each(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.each(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done();
   *   }, num * 10);
   * };
   * async.each(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   * @example
   *
   * // break
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num !== 2);
   *   }, num * 10);
   * };
   * async.each(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 2]
   * });
   *
   */
  var each = createEach(arrayEach, baseEach, symbolEach);

  /**
   * @memberof async
   * @namespace map
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var map = createMap(arrayEachIndex, baseEachIndex, symbolEachIndex, true);

  /**
   * @memberof async
   * @namespace mapValues
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var mapValues = createMap(arrayEachIndex, baseEachKey, symbolEachKey, false);

  /**
   * @memberof async
   * @namespace filter
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var filter = createFilter(arrayEachIndexValue, baseEachIndexValue, symbolEachIndexValue, true);

  /**
   * @memberof async
   * @namespace filterSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  var filterSeries = createFilterSeries(true);

  /**
   * @memberof async
   * @namespace filterLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var filterLimit = createFilterLimit(true);

  /**
   * @memberof async
   * @namespace reject
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(array, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(array, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var reject = createFilter(arrayEachIndexValue, baseEachIndexValue, symbolEachIndexValue, false);

  /**
   * @memberof async
   * @namespace rejectSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectSeries(array, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectSeries(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectSeries(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  var rejectSeries = createFilterSeries(false);

  /**
   * @memberof async
   * @namespace rejectLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var rejectLimit = createFilterLimit(false);

  /**
   * @memberof async
   * @namespace detect
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  var detect = createDetect(arrayEachValue, baseEachValue, symbolEachValue, true);

  /**
   * @memberof async
   * @namespace detectSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  var detectSeries = createDetectSeries(true);

  /**
   * @memberof async
   * @namespace detectLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  var detectLimit = createDetectLimit(true);

  /**
   * @memberof async
   * @namespace every
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 0], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 'a'], [2, 'c']]
   * });
   *
   */
  var every = createEvery(arrayEachValue, baseEachValue, symbolEachValue);

  /**
   * @memberof async
   * @namespace everySeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 'a'], [3, 'b'] [2, 'c']]
   * });
   *
   */
  var everySeries = createEverySeries();

  /**
   * @memberof async
   * @namespace everyLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 5, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 5, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e']]
   * });
   *
   */
  var everyLimit = createEveryLimit();

  /**
   * @memberof async
   * @namespace pick
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [[0, 1], [2, 2], [3, 1], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b'], [4, 'd']]
   * });
   *
   */
  var pick = createPick(arrayEachIndexValue, baseEachKeyValue, symbolEachKeyValue, true);

  /**
   * @memberof async
   * @namespace pickSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [[0, 1], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c'], [4, 'd']]
   * });
   *
   */
  var pickSeries = createPickSeries(true);

  /**
   * @memberof async
   * @namespace pickLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3 }
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var pickLimit = createPickLimit(true);

  /**
   * @memberof async
   * @namespace omit
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [[0, 1], [2, 2], [3, 1], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b'], [4, 'd']]
   * });
   *
   */
  var omit = createPick(arrayEachIndexValue, baseEachKeyValue, symbolEachKeyValue, false);

  /**
   * @memberof async
   * @namespace omitSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [[0, 1], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c'], [4, 'd']]
   * });
   *
   */
  var omitSeries = createPickSeries(false);

  /**
   * @memberof async
   * @namespace omitLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '3': 4, '4': 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '3': 4, '4': 2 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { d: 4, e: 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { d: 4, e: 2 }
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var omitLimit = createPickLimit(false);

  /**
   * @memberof async
   * @namespace transform
   * @param {Array|Object} collection
   * @param {Array|Object|Function} [accumulator]
   * @param {Function} [iterator]
   * @param {Function} [callback]
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num)
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4]
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // array with index and accumulator
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     result[index] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, {}, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2, '3': 4 }
   *   console.log(order); // [[1, 0], [2, 2], [3, 1], [4, 3]]
   * });
   *
   * @example
   *
   * // object with accumulator
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, [], iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4]
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     result[key] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, iterator, function(err, res) {
   *   console.log(res); //  { a: 1, b: 3, c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b'], [4, 'd']]
   * });
   *
   */
  var transform = createTransform(arrayEachResult, baseEachResult, symbolEachResult);

  /**
   * @memberof async
   * @namespace sortBy
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var sortBy = createSortBy(arrayEachIndexValue, baseEachIndexValue, symbolEachIndexValue);

  /**
   * @memberof async
   * @namespace concat
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var concat = createConcat(arrayEachIndex, baseEachIndex, symbolEachIndex);

  /**
   * @memberof async
   * @namespace groupBy
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [4.2, 6.1, 6.4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [[4.2, 0], [6.1, 2], [6.4, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [4.2, 6.1, 6.4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [[4.2, 'a'], [6.1, 'c'], [6.4, 'b']]
   * });
   *
   */
  var groupBy = createGroupBy(arrayEachValue, baseEachValue, symbolEachValue);

  /**
   * @memberof async
   * @namespace parallel
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(1);
   *      done(null, 1);
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(2);
   *      done(null, 2);
   *    }, 30);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(3);
   *      done(null, 3);
   *    }, 40);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(4);
   *      done(null, 4);
   *    }, 20);
   *  }
   * ];
   * async.parallel(tasks, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4];
   *   console.log(order); // [1, 4, 2, 3]
   * });
   *
   * @example
   *
   * var order = [];
   * var tasks = {
   *   'a': function(done) {
   *     setTimeout(function() {
   *       order.push(1);
   *       done(null, 1);
   *     }, 10);
   *   },
   *   'b': function(done) {
   *     setTimeout(function() {
   *       order.push(2);
   *       done(null, 2);
   *     }, 30);
   *   },
   *   'c': function(done) {
   *     setTimeout(function() {
   *       order.push(3);
   *       done(null, 3);
   *     }, 40);
   *   },
   *   'd': function(done) {
   *     setTimeout(function() {
   *       order.push(4);
   *       done(null, 4);
   *     }, 20);
   *   }
   * };
   * async.parallel(tasks, function(err, res) {
   *   console.log(res); // { a: 1, b: 2, c: 3, d:4 }
   *   console.log(order); // [1, 4, 2, 3]
   * });
   *
   */
  var parallel = createParallel(arrayEachFunc, baseEachFunc);

  /**
   * @memberof async
   * @namespace applyEach
   */
  var applyEach = createApplyEach(map);

  /**
   * @memberof async
   * @namespace applyEachSeries
   */
  var applyEachSeries = createApplyEach(mapSeries);

  /**
   * @memberof async
   * @namespace log
   */
  var log = createLogger('log');

  /**
   * @memberof async
   * @namespace dir
   */
  var dir = createLogger('dir');

  /**
   * @version 2.6.2
   * @namespace async
   */
  var index = {
    VERSION: '2.6.2',

    // Collections
    each: each,
    eachSeries: eachSeries,
    eachLimit: eachLimit,
    forEach: each,
    forEachSeries: eachSeries,
    forEachLimit: eachLimit,
    eachOf: each,
    eachOfSeries: eachSeries,
    eachOfLimit: eachLimit,
    forEachOf: each,
    forEachOfSeries: eachSeries,
    forEachOfLimit: eachLimit,
    map: map,
    mapSeries: mapSeries,
    mapLimit: mapLimit,
    mapValues: mapValues,
    mapValuesSeries: mapValuesSeries,
    mapValuesLimit: mapValuesLimit,
    filter: filter,
    filterSeries: filterSeries,
    filterLimit: filterLimit,
    select: filter,
    selectSeries: filterSeries,
    selectLimit: filterLimit,
    reject: reject,
    rejectSeries: rejectSeries,
    rejectLimit: rejectLimit,
    detect: detect,
    detectSeries: detectSeries,
    detectLimit: detectLimit,
    find: detect,
    findSeries: detectSeries,
    findLimit: detectLimit,
    pick: pick,
    pickSeries: pickSeries,
    pickLimit: pickLimit,
    omit: omit,
    omitSeries: omitSeries,
    omitLimit: omitLimit,
    reduce: reduce,
    inject: reduce,
    foldl: reduce,
    reduceRight: reduceRight,
    foldr: reduceRight,
    transform: transform,
    transformSeries: transformSeries,
    transformLimit: transformLimit,
    sortBy: sortBy,
    sortBySeries: sortBySeries,
    sortByLimit: sortByLimit,
    some: some,
    someSeries: someSeries,
    someLimit: someLimit,
    any: some,
    anySeries: someSeries,
    anyLimit: someLimit,
    every: every,
    everySeries: everySeries,
    everyLimit: everyLimit,
    all: every,
    allSeries: everySeries,
    allLimit: everyLimit,
    concat: concat,
    concatSeries: concatSeries,
    concatLimit: concatLimit,
    groupBy: groupBy,
    groupBySeries: groupBySeries,
    groupByLimit: groupByLimit,

    // Control Flow
    parallel: parallel,
    series: series,
    parallelLimit: parallelLimit,
    tryEach: tryEach,
    waterfall: waterfall,
    angelFall: angelFall,
    angelfall: angelFall,
    whilst: whilst,
    doWhilst: doWhilst,
    until: until,
    doUntil: doUntil,
    during: during,
    doDuring: doDuring,
    forever: forever,
    compose: compose,
    seq: seq,
    applyEach: applyEach,
    applyEachSeries: applyEachSeries,
    queue: queue,
    priorityQueue: priorityQueue,
    cargo: cargo,
    auto: auto,
    autoInject: autoInject,
    retry: retry,
    retryable: retryable,
    iterator: iterator,
    times: times,
    timesSeries: timesSeries,
    timesLimit: timesLimit,
    race: race,

    // Utils
    apply: apply,
    nextTick: asyncNextTick,
    setImmediate: asyncSetImmediate,
    memoize: memoize,
    unmemoize: unmemoize,
    ensureAsync: ensureAsync,
    constant: constant,
    asyncify: asyncify,
    wrapSync: asyncify,
    log: log,
    dir: dir,
    reflect: reflect,
    reflectAll: reflectAll,
    timeout: timeout,
    createLogger: createLogger,

    // Mode
    safe: safe,
    fast: fast
  };

  exports['default'] = index;
  baseEachSync(
    index,
    function(func, key) {
      exports[key] = func;
    },
    nativeKeys(index)
  );

  /**
   * @private
   */
  function createImmediate(safeMode) {
    var delay = function delay(fn) {
      var args = slice(arguments, 1);
      setTimeout(function() {
        fn.apply(null, args);
      });
    };
    asyncSetImmediate = typeof setImmediate === func ? setImmediate : delay;
    if (typeof process === obj && typeof process.nextTick === func) {
      nextTick = /^v0.10/.test(process.version) ? asyncSetImmediate : process.nextTick;
      asyncNextTick = /^v0/.test(process.version) ? asyncSetImmediate : process.nextTick;
    } else {
      asyncNextTick = nextTick = asyncSetImmediate;
    }
    if (safeMode === false) {
      nextTick = function(cb) {
        cb();
      };
    }
  }

  /* sync functions based on lodash */

  /**
   * Converts `arguments` to an array.
   *
   * @private
   * @param {Array} array = The array to slice.
   */
  function createArray(array) {
    var index = -1;
    var size = array.length;
    var result = Array(size);

    while (++index < size) {
      result[index] = array[index];
    }
    return result;
  }

  /**
   * Create an array from `start`
   *
   * @private
   * @param {Array} array - The array to slice.
   * @param {number} start - The start position.
   */
  function slice(array, start) {
    var end = array.length;
    var index = -1;
    var size = end - start;
    if (size <= 0) {
      return [];
    }
    var result = Array(size);

    while (++index < size) {
      result[index] = array[index + start];
    }
    return result;
  }

  /**
   * @private
   * @param {Object} object
   */
  function objectClone(object) {
    var keys = nativeKeys(object);
    var size = keys.length;
    var index = -1;
    var result = {};

    while (++index < size) {
      var key = keys[index];
      result[key] = object[key];
    }
    return result;
  }

  /**
   * Create an array with all falsey values removed.
   *
   * @private
   * @param {Array} array - The array to compact.
   */
  function compact(array) {
    var index = -1;
    var size = array.length;
    var result = [];

    while (++index < size) {
      var value = array[index];
      if (value) {
        result[result.length] = value;
      }
    }
    return result;
  }

  /**
   * Create an array of reverse sequence.
   *
   * @private
   * @param {Array} array - The array to reverse.
   */
  function reverse(array) {
    var index = -1;
    var size = array.length;
    var result = Array(size);
    var resIndex = size;

    while (++index < size) {
      result[--resIndex] = array[index];
    }
    return result;
  }

  /**
   * Checks if key exists in object property.
   *
   * @private
   * @param {Object} object - The object to inspect.
   * @param {string} key - The key to check.
   */
  function has(object, key) {
    return object.hasOwnProperty(key);
  }

  /**
   * Check if target exists in array.
   * @private
   * @param {Array} array
   * @param {*} target
   */
  function notInclude(array, target) {
    var index = -1;
    var size = array.length;

    while (++index < size) {
      if (array[index] === target) {
        return false;
      }
    }
    return true;
  }

  /**
   * @private
   * @param {Array} array - The array to iterate over.
   * @param {Function} iterator - The function invoked per iteration.
   */
  function arrayEachSync(array, iterator) {
    var index = -1;
    var size = array.length;

    while (++index < size) {
      iterator(array[index], index);
    }
    return array;
  }

  /**
   * @private
   * @param {Object} object - The object to iterate over.
   * @param {Function} iterator - The function invoked per iteration.
   * @param {Array} keys
   */
  function baseEachSync(object, iterator, keys) {
    var index = -1;
    var size = keys.length;

    while (++index < size) {
      var key = keys[index];
      iterator(object[key], key);
    }
    return object;
  }

  /**
   * @private
   * @param {number} n
   * @param {Function} iterator
   */
  function timesSync(n, iterator) {
    var index = -1;
    while (++index < n) {
      iterator(index);
    }
  }

  /**
   * @private
   * @param {Array} array
   * @param {number[]} criteria
   */
  function sortByCriteria(array, criteria) {
    var l = array.length;
    var indices = Array(l);
    var i;
    for (i = 0; i < l; i++) {
      indices[i] = i;
    }
    quickSort(criteria, 0, l - 1, indices);
    var result = Array(l);
    for (var n = 0; n < l; n++) {
      i = indices[n];
      result[n] = i === undefined ? array[n] : array[i];
    }
    return result;
  }

  function partition(array, i, j, mid, indices) {
    var l = i;
    var r = j;
    while (l <= r) {
      i = l;
      while (l < r && array[l] < mid) {
        l++;
      }
      while (r >= i && array[r] >= mid) {
        r--;
      }
      if (l > r) {
        break;
      }
      swap(array, indices, l++, r--);
    }
    return l;
  }

  function swap(array, indices, l, r) {
    var n = array[l];
    array[l] = array[r];
    array[r] = n;
    var i = indices[l];
    indices[l] = indices[r];
    indices[r] = i;
  }

  function quickSort(array, i, j, indices) {
    if (i === j) {
      return;
    }
    var k = i;
    while (++k <= j && array[i] === array[k]) {
      var l = k - 1;
      if (indices[l] > indices[k]) {
        var index = indices[l];
        indices[l] = indices[k];
        indices[k] = index;
      }
    }
    if (k > j) {
      return;
    }
    var p = array[i] > array[k] ? i : k;
    k = partition(array, i, j, array[p], indices);
    quickSort(array, i, k - 1, indices);
    quickSort(array, k, j, indices);
  }

  /**
   * @Private
   */
  function makeConcatResult(array) {
    var result = [];
    arrayEachSync(array, function(value) {
      if (value === noop) {
        return;
      }
      if (isArray(value)) {
        nativePush.apply(result, value);
      } else {
        result.push(value);
      }
    });
    return result;
  }

  /* async functions */

  /**
   * @private
   */
  function arrayEach(array, iterator, callback) {
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        iterator(array[index], index, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(array[index], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function baseEach(object, iterator, callback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], key, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(object[keys[index]], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function symbolEach(collection, iterator, callback) {
    var iter = collection[iteratorSymbol]();
    var index = 0;
    var item;
    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        iterator(item.value, index++, onlyOnce(callback));
      }
    } else {
      while ((item = iter.next()).done === false) {
        index++;
        iterator(item.value, onlyOnce(callback));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachResult(array, result, iterator, callback) {
    var index = -1;
    var size = array.length;

    if (iterator.length === 4) {
      while (++index < size) {
        iterator(result, array[index], index, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(result, array[index], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function baseEachResult(object, result, iterator, callback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 4) {
      while (++index < size) {
        key = keys[index];
        iterator(result, object[key], key, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(result, object[keys[index]], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachResult(collection, result, iterator, callback) {
    var item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 4) {
      while ((item = iter.next()).done === false) {
        iterator(result, item.value, index++, onlyOnce(callback));
      }
    } else {
      while ((item = iter.next()).done === false) {
        index++;
        iterator(result, item.value, onlyOnce(callback));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachFunc(array, createCallback) {
    var index = -1;
    var size = array.length;

    while (++index < size) {
      array[index](createCallback(index));
    }
  }

  /**
   * @private
   */
  function baseEachFunc(object, createCallback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    while (++index < size) {
      key = keys[index];
      object[key](createCallback(key));
    }
  }

  /**
   * @private
   */
  function arrayEachIndex(array, iterator, createCallback) {
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        iterator(array[index], index, createCallback(index));
      }
    } else {
      while (++index < size) {
        iterator(array[index], createCallback(index));
      }
    }
  }

  /**
   * @private
   */
  function baseEachIndex(object, iterator, createCallback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], key, createCallback(index));
      }
    } else {
      while (++index < size) {
        iterator(object[keys[index]], createCallback(index));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachIndex(collection, iterator, createCallback) {
    var item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        iterator(item.value, index, createCallback(index++));
      }
    } else {
      while ((item = iter.next()).done === false) {
        iterator(item.value, createCallback(index++));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function baseEachKey(object, iterator, createCallback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], key, createCallback(key));
      }
    } else {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], createCallback(key));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachKey(collection, iterator, createCallback) {
    var item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        iterator(item.value, index, createCallback(index++));
      }
    } else {
      while ((item = iter.next()).done === false) {
        iterator(item.value, createCallback(index++));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachValue(array, iterator, createCallback) {
    var value;
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        value = array[index];
        iterator(value, index, createCallback(value));
      }
    } else {
      while (++index < size) {
        value = array[index];
        iterator(value, createCallback(value));
      }
    }
  }

  /**
   * @private
   */
  function baseEachValue(object, iterator, createCallback, keys) {
    var key, value;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, key, createCallback(value));
      }
    } else {
      while (++index < size) {
        value = object[keys[index]];
        iterator(value, createCallback(value));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachValue(collection, iterator, createCallback) {
    var value, item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, index++, createCallback(value));
      }
    } else {
      while ((item = iter.next()).done === false) {
        index++;
        value = item.value;
        iterator(value, createCallback(value));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachIndexValue(array, iterator, createCallback) {
    var value;
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        value = array[index];
        iterator(value, index, createCallback(index, value));
      }
    } else {
      while (++index < size) {
        value = array[index];
        iterator(value, createCallback(index, value));
      }
    }
  }

  /**
   * @private
   */
  function baseEachIndexValue(object, iterator, createCallback, keys) {
    var key, value;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, key, createCallback(index, value));
      }
    } else {
      while (++index < size) {
        value = object[keys[index]];
        iterator(value, createCallback(index, value));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachIndexValue(collection, iterator, createCallback) {
    var value, item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, index, createCallback(index++, value));
      }
    } else {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, createCallback(index++, value));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function baseEachKeyValue(object, iterator, createCallback, keys) {
    var key, value;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, key, createCallback(key, value));
      }
    } else {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, createCallback(key, value));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachKeyValue(collection, iterator, createCallback) {
    var value, item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, index, createCallback(index++, value));
      }
    } else {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, createCallback(index++, value));
      }
    }
    return index;
  }

  /**
   * @private
   * @param {Function} func
   */
  function onlyOnce(func) {
    return function(err, res) {
      var fn = func;
      func = throwError;
      fn(err, res);
    };
  }

  /**
   * @private
   * @param {Function} func
   */
  function once(func) {
    return function(err, res) {
      var fn = func;
      func = noop;
      fn(err, res);
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   */
  function createEach(arrayEach, baseEach, symbolEach) {
    return function each(collection, iterator, callback) {
      callback = once(callback || noop);
      var size, keys;
      var completed = 0;
      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, done);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, done);
        size && size === completed && callback(null);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, done, keys);
      }
      if (!size) {
        callback(null);
      }

      function done(err, bool) {
        if (err) {
          callback = once(callback);
          callback(err);
        } else if (++completed === size) {
          callback(null);
        } else if (bool === false) {
          callback = once(callback);
          callback(null);
        }
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createMap(arrayEach, baseEach, symbolEach, useArray) {
    var init, clone;
    if (useArray) {
      init = Array;
      clone = createArray;
    } else {
      init = function() {
        return {};
      };
      clone = objectClone;
    }

    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = init(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        // TODO: size could be changed
        result = init(0);
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        result = init(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, init());
      }

      function createCallback(key) {
        return function done(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            callback = once(callback);
            callback(err, clone(result));
            return;
          }
          result[key] = res;
          key = null;
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   * @param {boolean} bool
   */
  function createFilter(arrayEach, baseEach, symbolEach, bool) {
    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = Array(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        result = [];
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, compact(result));
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        result = Array(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        return callback(null, []);
      }

      function createCallback(index, value) {
        return function done(err, res) {
          if (index === null) {
            throwError();
          }
          if (err) {
            index = null;
            callback = once(callback);
            callback(err);
            return;
          }
          if (!!res === bool) {
            result[index] = value;
          }
          index = null;
          if (++completed === size) {
            callback(null, compact(result));
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createFilterSeries(bool) {
    return function(collection, iterator, callback) {
      callback = onlyOnce(callback || noop);
      var size, key, value, keys, iter, item, iterate;
      var sync = false;
      var completed = 0;
      var result = [];

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size) {
        return callback(null, []);
      }
      iterate();

      function arrayIterator() {
        value = collection[completed];
        iterator(value, done);
      }

      function arrayIteratorWithIndex() {
        value = collection[completed];
        iterator(value, completed, done);
      }

      function symbolIterator() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, done);
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, completed, done);
      }

      function objectIterator() {
        key = keys[completed];
        value = collection[key];
        iterator(value, done);
      }

      function objectIteratorWithKey() {
        key = keys[completed];
        value = collection[key];
        iterator(value, key, done);
      }

      function done(err, res) {
        if (err) {
          callback(err);
          return;
        }
        if (!!res === bool) {
          result[result.length] = value;
        }
        if (++completed === size) {
          iterate = throwError;
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createFilterLimit(bool) {
    return function(collection, limit, iterator, callback) {
      callback = callback || noop;
      var size, index, key, value, keys, iter, item, iterate, result;
      var sync = false;
      var started = 0;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        result = [];
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size || isNaN(limit) || limit < 1) {
        return callback(null, []);
      }
      result = result || Array(size);
      timesSync(limit > size ? size : limit, iterate);

      function arrayIterator() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, createCallback(value, index));
        }
      }

      function arrayIteratorWithIndex() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, index, createCallback(value, index));
        }
      }

      function symbolIterator() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, compact(result));
        }
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, started, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, compact(result));
        }
      }

      function objectIterator() {
        index = started++;
        if (index < size) {
          value = collection[keys[index]];
          iterator(value, createCallback(value, index));
        }
      }

      function objectIteratorWithKey() {
        index = started++;
        if (index < size) {
          key = keys[index];
          value = collection[key];
          iterator(value, key, createCallback(value, index));
        }
      }

      function createCallback(value, index) {
        return function(err, res) {
          if (index === null) {
            throwError();
          }
          if (err) {
            index = null;
            iterate = noop;
            callback = once(callback);
            callback(err);
            return;
          }
          if (!!res === bool) {
            result[index] = value;
          }
          index = null;
          if (++completed === size) {
            callback = onlyOnce(callback);
            callback(null, compact(result));
          } else if (sync) {
            nextTick(iterate);
          } else {
            sync = true;
            iterate();
          }
          sync = false;
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace eachSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'b']]
   * });
   *
   * @example
   *
   * // break
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num !== 3);
   *   }, num * 10);
   * };
   * async.eachSeries(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3]
   * });
   */
  function eachSeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null);
    }
    iterate();

    function arrayIterator() {
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      iterator(collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, bool) {
      if (err) {
        callback(err);
      } else if (++completed === size || bool === false) {
        iterate = throwError;
        callback(null);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace eachLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   * @example
   *
   * // break
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num !== 5);
   *   }, num * 10);
   * };
   * async.eachLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 5]
   * });
   *
   */
  function eachLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, keys, iter, item, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    } else {
      return callback(null);
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        iterator(collection[started++], done);
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(collection[index], index, done);
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        started++;
        iterator(item.value, done);
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started++, done);
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null);
      }
    }

    function objectIterator() {
      if (started < size) {
        iterator(collection[keys[started++]], done);
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], key, done);
      }
    }

    function done(err, bool) {
      if (err || bool === false) {
        iterate = noop;
        callback = once(callback);
        callback(err);
      } else if (++completed === size) {
        iterator = noop;
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(null);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace mapSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function mapSeries(collection, iterator, callback) {
    callback = callback || noop;
    var size, key, keys, iter, item, result, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      result = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, []);
    }
    result = result || Array(size);
    iterate();

    function arrayIterator() {
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      iterator(collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, createArray(result));
        return;
      }
      result[completed] = res;
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
        callback = throwError;
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace mapLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function mapLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, keys, iter, item, result, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      result = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    result = result || Array(size);
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        iterator(collection[index], createCallback(index));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(collection[index], index, createCallback(index));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      index = started++;
      if (index < size) {
        iterator(collection[keys[index]], createCallback(index));
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], key, createCallback(index));
      }
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        if (err) {
          index = null;
          iterate = noop;
          callback = once(callback);
          callback(err, createArray(result));
          return;
        }
        result[index] = res;
        index = null;
        if (++completed === size) {
          iterate = throwError;
          callback(null, result);
          callback = throwError;
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace mapValuesSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function mapValuesSeries(collection, iterator, callback) {
    callback = callback || noop;
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var result = {};
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      key = completed;
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      key = completed;
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      key = completed;
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      key = completed;
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      key = keys[completed];
      iterator(collection[key], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, objectClone(result));
        return;
      }
      result[key] = res;
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
        callback = throwError;
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace mapValuesLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3, '3': 4, '4': 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3, '3': 4, '4': 2 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3, d: 4, e: 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3, d: 4, e: 2 }
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function mapValuesLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, keys, iter, item, iterate;
    var sync = false;
    var result = {};
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, result);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        iterator(collection[index], createCallback(index));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(collection[index], index, createCallback(index));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], createCallback(key));
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], key, createCallback(key));
      }
    }

    function createCallback(key) {
      return function(err, res) {
        if (key === null) {
          throwError();
        }
        if (err) {
          key = null;
          iterate = noop;
          callback = once(callback);
          callback(err, objectClone(result));
          return;
        }
        result[key] = res;
        key = null;
        if (++completed === size) {
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   * @param {boolean} bool
   */
  function createDetect(arrayEach, baseEach, symbolEach, bool) {
    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null);
      }

      function createCallback(value) {
        var called = false;
        return function done(err, res) {
          if (called) {
            throwError();
          }
          called = true;
          if (err) {
            callback = once(callback);
            callback(err);
          } else if (!!res === bool) {
            callback = once(callback);
            callback(null, value);
          } else if (++completed === size) {
            callback(null);
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createDetectSeries(bool) {
    return function(collection, iterator, callback) {
      callback = onlyOnce(callback || noop);
      var size, key, value, keys, iter, item, iterate;
      var sync = false;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size) {
        return callback(null);
      }
      iterate();

      function arrayIterator() {
        value = collection[completed];
        iterator(value, done);
      }

      function arrayIteratorWithIndex() {
        value = collection[completed];
        iterator(value, completed, done);
      }

      function symbolIterator() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null) : iterator(value, done);
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null) : iterator(value, completed, done);
      }

      function objectIterator() {
        value = collection[keys[completed]];
        iterator(value, done);
      }

      function objectIteratorWithKey() {
        key = keys[completed];
        value = collection[key];
        iterator(value, key, done);
      }

      function done(err, res) {
        if (err) {
          callback(err);
        } else if (!!res === bool) {
          iterate = throwError;
          callback(null, value);
        } else if (++completed === size) {
          iterate = throwError;
          callback(null);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createDetectLimit(bool) {
    return function(collection, limit, iterator, callback) {
      callback = callback || noop;
      var size, index, key, value, keys, iter, item, iterate;
      var sync = false;
      var started = 0;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size || isNaN(limit) || limit < 1) {
        return callback(null);
      }
      timesSync(limit > size ? size : limit, iterate);

      function arrayIterator() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, createCallback(value));
        }
      }

      function arrayIteratorWithIndex() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, index, createCallback(value));
        }
      }

      function symbolIterator() {
        item = iter.next();
        if (item.done === false) {
          started++;
          value = item.value;
          iterator(value, createCallback(value));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null);
        }
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, started++, createCallback(value));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null);
        }
      }

      function objectIterator() {
        index = started++;
        if (index < size) {
          value = collection[keys[index]];
          iterator(value, createCallback(value));
        }
      }

      function objectIteratorWithKey() {
        if (started < size) {
          key = keys[started++];
          value = collection[key];
          iterator(value, key, createCallback(value));
        }
      }

      function createCallback(value) {
        var called = false;
        return function(err, res) {
          if (called) {
            throwError();
          }
          called = true;
          if (err) {
            iterate = noop;
            callback = once(callback);
            callback(err);
          } else if (!!res === bool) {
            iterate = noop;
            callback = once(callback);
            callback(null, value);
          } else if (++completed === size) {
            callback(null);
          } else if (sync) {
            nextTick(iterate);
          } else {
            sync = true;
            iterate();
          }
          sync = false;
        };
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   * @param {boolean} bool
   */
  function createPick(arrayEach, baseEach, symbolEach, bool) {
    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys;
      var completed = 0;
      var result = {};

      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        return callback(null, {});
      }

      function createCallback(key, value) {
        return function done(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            callback = once(callback);
            callback(err, objectClone(result));
            return;
          }
          if (!!res === bool) {
            result[key] = value;
          }
          key = null;
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createPickSeries(bool) {
    return function(collection, iterator, callback) {
      callback = onlyOnce(callback || noop);
      var size, key, value, keys, iter, item, iterate;
      var sync = false;
      var result = {};
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size) {
        return callback(null, {});
      }
      iterate();

      function arrayIterator() {
        key = completed;
        value = collection[completed];
        iterator(value, done);
      }

      function arrayIteratorWithIndex() {
        key = completed;
        value = collection[completed];
        iterator(value, completed, done);
      }

      function symbolIterator() {
        key = completed;
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, done);
      }

      function symbolIteratorWithKey() {
        key = completed;
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, key, done);
      }

      function objectIterator() {
        key = keys[completed];
        value = collection[key];
        iterator(value, done);
      }

      function objectIteratorWithKey() {
        key = keys[completed];
        value = collection[key];
        iterator(value, key, done);
      }

      function done(err, res) {
        if (err) {
          callback(err, result);
          return;
        }
        if (!!res === bool) {
          result[key] = value;
        }
        if (++completed === size) {
          iterate = throwError;
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createPickLimit(bool) {
    return function(collection, limit, iterator, callback) {
      callback = callback || noop;
      var size, index, key, value, keys, iter, item, iterate;
      var sync = false;
      var result = {};
      var started = 0;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size || isNaN(limit) || limit < 1) {
        return callback(null, {});
      }
      timesSync(limit > size ? size : limit, iterate);

      function arrayIterator() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, createCallback(value, index));
        }
      }

      function arrayIteratorWithIndex() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, index, createCallback(value, index));
        }
      }

      function symbolIterator() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, result);
        }
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, started, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, result);
        }
      }

      function objectIterator() {
        if (started < size) {
          key = keys[started++];
          value = collection[key];
          iterator(value, createCallback(value, key));
        }
      }

      function objectIteratorWithKey() {
        if (started < size) {
          key = keys[started++];
          value = collection[key];
          iterator(value, key, createCallback(value, key));
        }
      }

      function createCallback(value, key) {
        return function(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            iterate = noop;
            callback = once(callback);
            callback(err, objectClone(result));
            return;
          }
          if (!!res === bool) {
            result[key] = value;
          }
          key = null;
          if (++completed === size) {
            iterate = throwError;
            callback = onlyOnce(callback);
            callback(null, result);
          } else if (sync) {
            nextTick(iterate);
          } else {
            sync = true;
            iterate();
          }
          sync = false;
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace reduce
   * @param {Array|Object} collection
   * @param {*} result
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, '', iterator, function(err, res) {
   *   console.log(res); // '1324'
   *   console.log(order); // [[1, 0], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, '', iterator, function(err, res) {
   *   console.log(res); // '1324'
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'b'], [4, 'd']]
   * });
   *
   */
  function reduce(collection, result, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 4 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate(result);

    function arrayIterator(result) {
      iterator(result, collection[completed], done);
    }

    function arrayIteratorWithIndex(result) {
      iterator(result, collection[completed], completed, done);
    }

    function symbolIterator(result) {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, done);
    }

    function symbolIteratorWithKey(result) {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, completed, done);
    }

    function objectIterator(result) {
      iterator(result, collection[keys[completed]], done);
    }

    function objectIteratorWithKey(result) {
      key = keys[completed];
      iterator(result, collection[key], key, done);
    }

    function done(err, result) {
      if (err) {
        callback(err, result);
      } else if (++completed === size) {
        iterator = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(function() {
          iterate(result);
        });
      } else {
        sync = true;
        iterate(result);
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace reduceRight
   * @param {Array|Object} collection
   * @param {*} result
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [4, 2, 3, 1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, '', iterator, function(err, res) {
   *   console.log(res); // '4231'
   *   console.log(order); // [[4, 3], [2, 2], [3, 1], [1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, '', iterator, function(err, res) {
   *   console.log(res); // '4231'
   *   console.log(order); // [4, 2, 3, 1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [[4, 3], [2, 2], [3, 1], [1, 0]]
   * });
   *
   */
  function reduceRight(collection, result, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var resIndex, index, key, keys, iter, item, col, iterate;
    var sync = false;

    if (isArray(collection)) {
      resIndex = collection.length;
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      col = [];
      iter = collection[iteratorSymbol]();
      index = -1;
      while ((item = iter.next()).done === false) {
        col[++index] = item.value;
      }
      collection = col;
      resIndex = col.length;
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      resIndex = keys.length;
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!resIndex) {
      return callback(null, result);
    }
    iterate(result);

    function arrayIterator(result) {
      iterator(result, collection[--resIndex], done);
    }

    function arrayIteratorWithIndex(result) {
      iterator(result, collection[--resIndex], resIndex, done);
    }

    function objectIterator(result) {
      iterator(result, collection[keys[--resIndex]], done);
    }

    function objectIteratorWithKey(result) {
      key = keys[--resIndex];
      iterator(result, collection[key], key, done);
    }

    function done(err, result) {
      if (err) {
        callback(err, result);
      } else if (resIndex === 0) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(function() {
          iterate(result);
        });
      } else {
        sync = true;
        iterate(result);
      }
      sync = false;
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createTransform(arrayEach, baseEach, symbolEach) {
    return function transform(collection, accumulator, iterator, callback) {
      if (arguments.length === 3) {
        callback = iterator;
        iterator = accumulator;
        accumulator = undefined;
      }
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = accumulator !== undefined ? accumulator : [];
        arrayEach(collection, result, iterator, done);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        result = accumulator !== undefined ? accumulator : {};
        size = symbolEach(collection, result, iterator, done);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        result = accumulator !== undefined ? accumulator : {};
        baseEach(collection, result, iterator, done, keys);
      }
      if (!size) {
        callback(null, accumulator !== undefined ? accumulator : result || {});
      }

      function done(err, bool) {
        if (err) {
          callback = once(callback);
          callback(err, isArray(result) ? createArray(result) : objectClone(result));
        } else if (++completed === size) {
          callback(null, result);
        } else if (bool === false) {
          callback = once(callback);
          callback(null, isArray(result) ? createArray(result) : objectClone(result));
        }
      }
    };
  }

  /**
   * @memberof async
   * @namespace transformSeries
   * @param {Array|Object} collection
   * @param {Array|Object|Function} [accumulator]
   * @param {Function} [iterator]
   * @param {Function} [callback]
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num)
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2, 4]
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index and accumulator
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     result[index] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, {}, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2, '3': 4 }
   *   console.log(order); // [[1, 0], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object with accumulator
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, [], iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2, 4]
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     result[key] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, iterator, function(err, res) {
   *   console.log(res); //  { a: 1, b: 3, c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'b'], [4, 'd']]
   * });
   *
   */
  function transformSeries(collection, accumulator, iterator, callback) {
    if (arguments.length === 3) {
      callback = iterator;
      iterator = accumulator;
      accumulator = undefined;
    }
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate, result;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      result = accumulator !== undefined ? accumulator : [];
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, accumulator !== undefined ? accumulator : result || {});
    }
    iterate();

    function arrayIterator() {
      iterator(result, collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(result, collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, completed, done);
    }

    function objectIterator() {
      iterator(result, collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(result, collection[key], key, done);
    }

    function done(err, bool) {
      if (err) {
        callback(err, result);
      } else if (++completed === size || bool === false) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace transformLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Array|Object|Function} [accumulator]
   * @param {Function} [iterator]
   * @param {Function} [callback]
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index and accumulator
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     result[index] = key;
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(array, 2, {}, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3, '3': 4, '4': 2 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object with accumulator
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(object, 2, [], iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     result[key] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3, d: 4, e: 2 };
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function transformLimit(collection, limit, accumulator, iterator, callback) {
    if (arguments.length === 4) {
      callback = iterator;
      iterator = accumulator;
      accumulator = undefined;
    }
    callback = callback || noop;
    var size, index, key, keys, iter, item, iterate, result;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      result = accumulator !== undefined ? accumulator : [];
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, accumulator !== undefined ? accumulator : result || {});
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        iterator(result, collection[index], onlyOnce(done));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(result, collection[index], index, onlyOnce(done));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        started++;
        iterator(result, item.value, onlyOnce(done));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(result, item.value, started++, onlyOnce(done));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      index = started++;
      if (index < size) {
        iterator(result, collection[keys[index]], onlyOnce(done));
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(result, collection[key], key, onlyOnce(done));
      }
    }

    function done(err, bool) {
      if (err || bool === false) {
        iterate = noop;
        callback(err || null, isArray(result) ? createArray(result) : objectClone(result));
        callback = noop;
      } else if (++completed === size) {
        iterator = noop;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @private
   * @param {function} arrayEach
   * @param {function} baseEach
   * @param {function} symbolEach
   */
  function createSortBy(arrayEach, baseEach, symbolEach) {
    return function sortBy(collection, iterator, callback) {
      callback = callback || noop;
      var size, array, criteria;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        array = Array(size);
        criteria = Array(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        array = [];
        criteria = [];
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, sortByCriteria(array, criteria));
      } else if (typeof collection === obj) {
        var keys = nativeKeys(collection);
        size = keys.length;
        array = Array(size);
        criteria = Array(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, []);
      }

      function createCallback(index, value) {
        var called = false;
        array[index] = value;
        return function done(err, criterion) {
          if (called) {
            throwError();
          }
          called = true;
          criteria[index] = criterion;
          if (err) {
            callback = once(callback);
            callback(err);
          } else if (++completed === size) {
            callback(null, sortByCriteria(array, criteria));
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace sortBySeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function sortBySeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, value, keys, iter, item, array, criteria, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      array = collection;
      criteria = Array(size);
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      array = [];
      criteria = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      array = Array(size);
      criteria = Array(size);
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, []);
    }
    iterate();

    function arrayIterator() {
      value = collection[completed];
      iterator(value, done);
    }

    function arrayIteratorWithIndex() {
      value = collection[completed];
      iterator(value, completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done) {
        return callback(null, sortByCriteria(array, criteria));
      }
      value = item.value;
      array[completed] = value;
      iterator(value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done) {
        return callback(null, sortByCriteria(array, criteria));
      }
      value = item.value;
      array[completed] = value;
      iterator(value, completed, done);
    }

    function objectIterator() {
      value = collection[keys[completed]];
      array[completed] = value;
      iterator(value, done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      value = collection[key];
      array[completed] = value;
      iterator(value, key, done);
    }

    function done(err, criterion) {
      criteria[completed] = criterion;
      if (err) {
        callback(err);
      } else if (++completed === size) {
        iterate = throwError;
        callback(null, sortByCriteria(array, criteria));
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace sortByLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function sortByLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, value, array, keys, iter, item, criteria, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      array = collection;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      array = [];
      criteria = [];
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      array = Array(size);
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    criteria = criteria || Array(size);
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        value = collection[started];
        iterator(value, createCallback(value, started++));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        value = collection[index];
        iterator(value, index, createCallback(value, index));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        value = item.value;
        array[started] = value;
        iterator(value, createCallback(value, started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, sortByCriteria(array, criteria));
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        value = item.value;
        array[started] = value;
        iterator(value, started, createCallback(value, started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, sortByCriteria(array, criteria));
      }
    }

    function objectIterator() {
      if (started < size) {
        value = collection[keys[started]];
        array[started] = value;
        iterator(value, createCallback(value, started++));
      }
    }

    function objectIteratorWithKey() {
      if (started < size) {
        key = keys[started];
        value = collection[key];
        array[started] = value;
        iterator(value, key, createCallback(value, started++));
      }
    }

    function createCallback(value, index) {
      var called = false;
      return function(err, criterion) {
        if (called) {
          throwError();
        }
        called = true;
        criteria[index] = criterion;
        if (err) {
          iterate = noop;
          callback(err);
          callback = noop;
        } else if (++completed === size) {
          callback(null, sortByCriteria(array, criteria));
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace some
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  function some(collection, iterator, callback) {
    callback = callback || noop;
    detect(collection, iterator, done);

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, !!res);
    }
  }

  /**
   * @memberof async
   * @namespace someSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  function someSeries(collection, iterator, callback) {
    callback = callback || noop;
    detectSeries(collection, iterator, done);

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, !!res);
    }
  }

  /**
   * @memberof async
   * @namespace someLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  function someLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    detectLimit(collection, limit, iterator, done);

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, !!res);
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createEvery(arrayEach, baseEach, symbolEach) {
    var deny = createDetect(arrayEach, baseEach, symbolEach, false);

    return function every(collection, iterator, callback) {
      callback = callback || noop;
      deny(collection, iterator, done);

      function done(err, res) {
        if (err) {
          return callback(err);
        }
        callback(null, !res);
      }
    };
  }

  /**
   * @private
   */
  function createEverySeries() {
    var denySeries = createDetectSeries(false);

    return function everySeries(collection, iterator, callback) {
      callback = callback || noop;
      denySeries(collection, iterator, done);

      function done(err, res) {
        if (err) {
          return callback(err);
        }
        callback(null, !res);
      }
    };
  }

  /**
   * @private
   */
  function createEveryLimit() {
    var denyLimit = createDetectLimit(false);

    return function everyLimit(collection, limit, iterator, callback) {
      callback = callback || noop;
      denyLimit(collection, limit, iterator, done);

      function done(err, res) {
        if (err) {
          return callback(err);
        }
        callback(null, !res);
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createConcat(arrayEach, baseEach, symbolEach) {
    return function concat(collection, iterator, callback) {
      callback = callback || noop;
      var size, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = Array(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        result = [];
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        var keys = nativeKeys(collection);
        size = keys.length;
        result = Array(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, []);
      }

      function createCallback(index) {
        return function done(err, res) {
          if (index === null) {
            throwError();
          }
          if (err) {
            index = null;
            callback = once(callback);
            arrayEachSync(result, function(array, index) {
              if (array === undefined) {
                result[index] = noop;
              }
            });
            callback(err, makeConcatResult(result));
            return;
          }
          switch (arguments.length) {
            case 0:
            case 1:
              result[index] = noop;
              break;
            case 2:
              result[index] = res;
              break;
            default:
              result[index] = slice(arguments, 1);
              break;
          }
          index = null;
          if (++completed === size) {
            callback(null, makeConcatResult(result));
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace concatSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function concatSeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var result = [];
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      iterator(collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, array) {
      if (isArray(array)) {
        nativePush.apply(result, array);
      } else if (arguments.length >= 2) {
        nativePush.apply(result, slice(arguments, 1));
      }
      if (err) {
        callback(err, result);
      } else if (++completed === size) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace concatLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.cocnatLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.cocnatLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function concatLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, key, iter, item, iterate, result;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      result = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      var keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    result = result || Array(size);
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        iterator(collection[started], createCallback(started++));
      }
    }

    function arrayIteratorWithIndex() {
      if (started < size) {
        iterator(collection[started], started, createCallback(started++));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, makeConcatResult(result));
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, makeConcatResult(result));
      }
    }

    function objectIterator() {
      if (started < size) {
        iterator(collection[keys[started]], createCallback(started++));
      }
    }

    function objectIteratorWithKey() {
      if (started < size) {
        key = keys[started];
        iterator(collection[key], key, createCallback(started++));
      }
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        if (err) {
          index = null;
          iterate = noop;
          callback = once(callback);
          arrayEachSync(result, function(array, index) {
            if (array === undefined) {
              result[index] = noop;
            }
          });
          callback(err, makeConcatResult(result));
          return;
        }
        switch (arguments.length) {
          case 0:
          case 1:
            result[index] = noop;
            break;
          case 2:
            result[index] = res;
            break;
          default:
            result[index] = slice(arguments, 1);
            break;
        }
        index = null;
        if (++completed === size) {
          iterate = throwError;
          callback(null, makeConcatResult(result));
          callback = throwError;
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createGroupBy(arrayEach, baseEach, symbolEach) {
    return function groupBy(collection, iterator, callback) {
      callback = callback || noop;
      var size;
      var completed = 0;
      var result = {};

      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        var keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, {});
      }

      function createCallback(value) {
        var called = false;
        return function done(err, key) {
          if (called) {
            throwError();
          }
          called = true;
          if (err) {
            callback = once(callback);
            callback(err, objectClone(result));
            return;
          }
          var array = result[key];
          if (!array) {
            result[key] = [value];
          } else {
            array.push(value);
          }
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace groupBySeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [4.2, 6.4, 6.1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [[4.2, 0], [6.4, 1], [6.1, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [4.2, 6.4, 6.1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [[4.2, 'a'], [6.4, 'b'], [6.1, 'c']]
   * });
   *
   */
  function groupBySeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, value, keys, iter, item, iterate;
    var sync = false;
    var completed = 0;
    var result = {};

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      value = collection[completed];
      iterator(value, done);
    }

    function arrayIteratorWithIndex() {
      value = collection[completed];
      iterator(value, completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      value = item.value;
      item.done ? callback(null, result) : iterator(value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      value = item.value;
      item.done ? callback(null, result) : iterator(value, completed, done);
    }

    function objectIterator() {
      value = collection[keys[completed]];
      iterator(value, done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      value = collection[key];
      iterator(value, key, done);
    }

    function done(err, key) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, objectClone(result));
        return;
      }
      var array = result[key];
      if (!array) {
        result[key] = [value];
      } else {
        array.push(value);
      }
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace groupByLimit
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1.1, 5.9, 3.2, 3.9, 2.1];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [1.1, 3.2, 5.9, 2.1, 3.9]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1.1, 5.9, 3.2, 3.9, 2.1];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [[1.1, 0], [3.2, 2], [5.9, 1], [2.1, 4], [3.9, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1.1, b: 5.9, c: 3.2, d: 3.9, e: 2.1 }
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [1.1, 3.2, 5.9, 2.1, 3.9]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1.1, b: 5.9, c: 3.2, d: 3.9, e: 2.1 }
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [[1.1, 'a'], [3.2, 'c'], [5.9, 'b'], [2.1, 'e'], [3.9, 'd']]
   * });
   *
   */
  function groupByLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, value, keys, iter, item, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;
    var result = {};

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, result);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        value = collection[started++];
        iterator(value, createCallback(value));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        value = collection[index];
        iterator(value, index, createCallback(value));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        started++;
        value = item.value;
        iterator(value, createCallback(value));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        value = item.value;
        iterator(value, started++, createCallback(value));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      if (started < size) {
        value = collection[keys[started++]];
        iterator(value, createCallback(value));
      }
    }

    function objectIteratorWithKey() {
      if (started < size) {
        key = keys[started++];
        value = collection[key];
        iterator(value, key, createCallback(value));
      }
    }

    function createCallback(value) {
      var called = false;
      return function(err, key) {
        if (called) {
          throwError();
        }
        called = true;
        if (err) {
          iterate = noop;
          callback = once(callback);
          callback(err, objectClone(result));
          return;
        }
        var array = result[key];
        if (!array) {
          result[key] = [value];
        } else {
          array.push(value);
        }
        if (++completed === size) {
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   */
  function createParallel(arrayEach, baseEach) {
    return function parallel(tasks, callback) {
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(tasks)) {
        size = tasks.length;
        result = Array(size);
        arrayEach(tasks, createCallback);
      } else if (tasks && typeof tasks === obj) {
        keys = nativeKeys(tasks);
        size = keys.length;
        result = {};
        baseEach(tasks, createCallback, keys);
      }
      if (!size) {
        callback(null, result);
      }

      function createCallback(key) {
        return function(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            callback = once(callback);
            callback(err, result);
            return;
          }
          result[key] = arguments.length <= 2 ? res : slice(arguments, 1);
          key = null;
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace series
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(1);
   *      done(null, 1);
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(2);
   *      done(null, 2);
   *    }, 30);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(3);
   *      done(null, 3);
   *    }, 40);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(4);
   *      done(null, 4);
   *    }, 20);
   *  }
   * ];
   * async.series(tasks, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4];
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * var order = [];
   * var tasks = {
   *   'a': function(done) {
   *     setTimeout(function() {
   *       order.push(1);
   *       done(null, 1);
   *     }, 10);
   *   },
   *   'b': function(done) {
   *     setTimeout(function() {
   *       order.push(2);
   *       done(null, 2);
   *     }, 30);
   *   },
   *   'c': function(done) {
   *     setTimeout(function() {
   *       order.push(3);
   *       done(null, 3);
   *     }, 40);
   *   },
   *   'd': function(done) {
   *     setTimeout(function() {
   *       order.push(4);
   *       done(null, 4);
   *     }, 20);
   *   }
   * };
   * async.series(tasks, function(err, res) {
   *   console.log(res); // { a: 1, b: 2, c: 3, d:4 }
   *   console.log(order); // [1, 4, 2, 3]
   * });
   *
   */
  function series(tasks, callback) {
    callback = callback || noop;
    var size, key, keys, result, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(tasks)) {
      size = tasks.length;
      result = Array(size);
      iterate = arrayIterator;
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      result = {};
      iterate = objectIterator;
    } else {
      return callback(null);
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      key = completed;
      tasks[completed](done);
    }

    function objectIterator() {
      key = keys[completed];
      tasks[key](done);
    }

    function done(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, result);
        return;
      }
      result[key] = arguments.length <= 2 ? res : slice(arguments, 1);
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace parallelLimit
   * @param {Array|Object} tasks - functions
   * @param {number} limit - limit >= 1
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(1);
   *      done(null, 1);
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(2);
   *      done(null, 2);
   *    }, 50);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(3);
   *      done(null, 3);
   *    }, 30);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(4);
   *      done(null, 4);
   *    }, 40);
   *  }
   * ];
   * async.parallelLimit(tasks, 2, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4];
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * var order = [];
   * var tasks = {
   *   'a': function(done) {
   *     setTimeout(function() {
   *       order.push(1);
   *       done(null, 1);
   *     }, 10);
   *   },
   *   'b': function(done) {
   *     setTimeout(function() {
   *       order.push(2);
   *       done(null, 2);
   *     }, 50);
   *   },
   *   'c': function(done) {
   *     setTimeout(function() {
   *       order.push(3);
   *       done(null, 3);
   *     }, 20);
   *   },
   *   'd': function(done) {
   *     setTimeout(function() {
   *       order.push(4);
   *       done(null, 4);
   *     }, 40);
   *   }
   * };
   * async.parallelLimit(tasks, 2, function(err, res) {
   *   console.log(res); // { a: 1, b: 2, c: 3, d:4 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   */
  function parallelLimit(tasks, limit, callback) {
    callback = callback || noop;
    var size, index, key, keys, result, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(tasks)) {
      size = tasks.length;
      result = Array(size);
      iterate = arrayIterator;
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      result = {};
      iterate = objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, result);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        tasks[index](createCallback(index));
      }
    }

    function objectIterator() {
      if (started < size) {
        key = keys[started++];
        tasks[key](createCallback(key));
      }
    }

    function createCallback(key) {
      return function(err, res) {
        if (key === null) {
          throwError();
        }
        if (err) {
          key = null;
          iterate = noop;
          callback = once(callback);
          callback(err, result);
          return;
        }
        result[key] = arguments.length <= 2 ? res : slice(arguments, 1);
        key = null;
        if (++completed === size) {
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace tryEach
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      done(new Error('error'));
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      done(null, 2);
   *    }, 10);
   *  }
   * ];
   * async.tryEach(tasks, function(err, res) {
   *   console.log(res); // 2
   * });
   *
   * @example
   *
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      done(new Error('error1'));
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      done(new Error('error2');
   *    }, 10);
   *  }
   * ];
   * async.tryEach(tasks, function(err, res) {
   *   console.log(err); // error2
   *   console.log(res); // undefined
   * });
   *
   */
  function tryEach(tasks, callback) {
    callback = callback || noop;
    var size, keys, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(tasks)) {
      size = tasks.length;
      iterate = arrayIterator;
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      iterate = objectIterator;
    }
    if (!size) {
      return callback(null);
    }
    iterate();

    function arrayIterator() {
      tasks[completed](done);
    }

    function objectIterator() {
      tasks[keys[completed]](done);
    }

    function done(err, res) {
      if (!err) {
        if (arguments.length <= 2) {
          callback(null, res);
        } else {
          callback(null, slice(arguments, 1));
        }
      } else if (++completed === size) {
        callback(err);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * check for waterfall tasks
   * @private
   * @param {Array} tasks
   * @param {Function} callback
   * @return {boolean}
   */
  function checkWaterfallTasks(tasks, callback) {
    if (!isArray(tasks)) {
      callback(new Error('First argument to waterfall must be an array of functions'));
      return false;
    }
    if (tasks.length === 0) {
      callback(null);
      return false;
    }
    return true;
  }

  /**
   * check for waterfall tasks
   * @private
   * @param {function} func
   * @param {Array|Object} args - arguments
   * @return {function} next
   */
  function waterfallIterator(func, args, next) {
    switch (args.length) {
      case 0:
      case 1:
        return func(next);
      case 2:
        return func(args[1], next);
      case 3:
        return func(args[1], args[2], next);
      case 4:
        return func(args[1], args[2], args[3], next);
      case 5:
        return func(args[1], args[2], args[3], args[4], next);
      case 6:
        return func(args[1], args[2], args[3], args[4], args[5], next);
      default:
        args = slice(args, 1);
        args.push(next);
        return func.apply(null, args);
    }
  }

  /**
   * @memberof async
   * @namespace waterfall
   * @param {Array} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *   function(next) {
   *     setTimeout(function() {
   *       order.push(1);
   *       next(null, 1);
   *     }, 10);
   *   },
   *   function(arg1, next) {
   *     setTimeout(function() {
   *       order.push(2);
   *       next(null, 1, 2);
   *     }, 30);
   *   },
   *   function(arg1, arg2, next) {
   *     setTimeout(function() {
   *       order.push(3);
   *       next(null, 3);
   *     }, 20);
   *   },
   *   function(arg1, next) {
   *     setTimeout(function() {
   *       order.push(4);
   *       next(null, 1, 2, 3, 4);
   *     }, 40);
   *   }
   * ];
   * async.waterfall(tasks, function(err, arg1, arg2, arg3, arg4) {
   *   console.log(arg1, arg2, arg3, arg4); // 1 2 3 4
   * });
   *
   */
  function waterfall(tasks, callback) {
    callback = callback || noop;
    if (!checkWaterfallTasks(tasks, callback)) {
      return;
    }
    var func, args, done, sync;
    var completed = 0;
    var size = tasks.length;
    waterfallIterator(tasks[0], [], createCallback(0));

    function iterate() {
      waterfallIterator(func, args, createCallback(func));
    }

    function createCallback(index) {
      return function next(err, res) {
        if (index === undefined) {
          callback = noop;
          throwError();
        }
        index = undefined;
        if (err) {
          done = callback;
          callback = throwError;
          done(err);
          return;
        }
        if (++completed === size) {
          done = callback;
          callback = throwError;
          if (arguments.length <= 2) {
            done(err, res);
          } else {
            done.apply(null, createArray(arguments));
          }
          return;
        }
        if (sync) {
          args = arguments;
          func = tasks[completed] || throwError;
          nextTick(iterate);
        } else {
          sync = true;
          waterfallIterator(tasks[completed] || throwError, arguments, createCallback(completed));
        }
        sync = false;
      };
    }
  }

  /**
   * `angelFall` is like `waterfall` and inject callback to last argument of next task.
   *
   * @memberof async
   * @namespace angelFall
   * @param {Array} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *   function(next) {
   *     setTimeout(function() {
   *       order.push(1);
   *       next(null, 1);
   *     }, 10);
   *   },
   *   function(arg1, empty, next) {
   *     setTimeout(function() {
   *       order.push(2);
   *       next(null, 1, 2);
   *     }, 30);
   *   },
   *   function(next) {
   *     setTimeout(function() {
   *       order.push(3);
   *       next(null, 3);
   *     }, 20);
   *   },
   *   function(arg1, empty1, empty2, empty3, next) {
   *     setTimeout(function() {
   *       order.push(4);
   *       next(null, 1, 2, 3, 4);
   *     }, 40);
   *   }
   * ];
   * async.angelFall(tasks, function(err, arg1, arg2, arg3, arg4) {
   *   console.log(arg1, arg2, arg3, arg4); // 1 2 3 4
   * });
   *
   */
  function angelFall(tasks, callback) {
    callback = callback || noop;
    if (!checkWaterfallTasks(tasks, callback)) {
      return;
    }
    var completed = 0;
    var sync = false;
    var size = tasks.length;
    var func = tasks[completed];
    var args = [];
    var iterate = function() {
      switch (func.length) {
        case 0:
          try {
            next(null, func());
          } catch (e) {
            next(e);
          }
          return;
        case 1:
          return func(next);
        case 2:
          return func(args[1], next);
        case 3:
          return func(args[1], args[2], next);
        case 4:
          return func(args[1], args[2], args[3], next);
        case 5:
          return func(args[1], args[2], args[3], args[4], next);
        default:
          args = slice(args, 1);
          args[func.length - 1] = next;
          return func.apply(null, args);
      }
    };
    iterate();

    function next(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err);
        return;
      }
      if (++completed === size) {
        iterate = throwError;
        var done = callback;
        callback = throwError;
        if (arguments.length === 2) {
          done(err, res);
        } else {
          done.apply(null, createArray(arguments));
        }
        return;
      }
      func = tasks[completed];
      args = arguments;
      if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace whilst
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function whilst(test, iterator, callback) {
    callback = callback || noop;
    var sync = false;
    if (test()) {
      iterate();
    } else {
      callback(null);
    }

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace doWhilst
   * @param {Function} iterator
   * @param {Function} test
   * @param {Function} callback
   */
  function doWhilst(iterator, test, callback) {
    callback = callback || noop;
    var sync = false;
    next();

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace until
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function until(test, iterator, callback) {
    callback = callback || noop;
    var sync = false;
    if (!test()) {
      iterate();
    } else {
      callback(null);
    }

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (!test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (!test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace doUntil
   * @param {Function} iterator
   * @param {Function} test
   * @param {Function} callback
   */
  function doUntil(iterator, test, callback) {
    callback = callback || noop;
    var sync = false;
    next();

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (!test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (!test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace during
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function during(test, iterator, callback) {
    callback = callback || noop;
    _test();

    function _test() {
      test(iterate);
    }

    function iterate(err, truth) {
      if (err) {
        return callback(err);
      }
      if (truth) {
        iterator(done);
      } else {
        callback(null);
      }
    }

    function done(err) {
      if (err) {
        return callback(err);
      }
      _test();
    }
  }

  /**
   * @memberof async
   * @namespace doDuring
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function doDuring(iterator, test, callback) {
    callback = callback || noop;
    iterate(null, true);

    function iterate(err, truth) {
      if (err) {
        return callback(err);
      }
      if (truth) {
        iterator(done);
      } else {
        callback(null);
      }
    }

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      switch (arguments.length) {
        case 0:
        case 1:
          test(iterate);
          break;
        case 2:
          test(res, iterate);
          break;
        default:
          var args = slice(arguments, 1);
          args.push(iterate);
          test.apply(null, args);
          break;
      }
    }
  }

  /**
   * @memberof async
   * @namespace forever
   */
  function forever(iterator, callback) {
    var sync = false;
    iterate();

    function iterate() {
      iterator(next);
    }

    function next(err) {
      if (err) {
        if (callback) {
          return callback(err);
        }
        throw err;
      }
      if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace compose
   */
  function compose() {
    return seq.apply(null, reverse(arguments));
  }

  /**
   * @memberof async
   * @namespace seq
   */
  function seq(/* functions... */) {
    var fns = createArray(arguments);

    return function() {
      var self = this;
      var args = createArray(arguments);
      var callback = args[args.length - 1];
      if (typeof callback === func) {
        args.pop();
      } else {
        callback = noop;
      }
      reduce(fns, args, iterator, done);

      function iterator(newargs, fn, callback) {
        var func = function(err) {
          var nextargs = slice(arguments, 1);
          callback(err, nextargs);
        };
        newargs.push(func);
        fn.apply(self, newargs);
      }

      function done(err, res) {
        res = isArray(res) ? res : [res];
        res.unshift(err);
        callback.apply(self, res);
      }
    };
  }

  function createApplyEach(func) {
    return function applyEach(fns /* arguments */) {
      var go = function() {
        var self = this;
        var args = createArray(arguments);
        var callback = args.pop() || noop;
        return func(fns, iterator, callback);

        function iterator(fn, done) {
          fn.apply(self, args.concat([done]));
        }
      };
      if (arguments.length > 1) {
        var args = slice(arguments, 1);
        return go.apply(this, args);
      } else {
        return go;
      }
    };
  }

  /**
   * @see https://github.com/caolan/async/blob/master/lib/internal/DoublyLinkedList.js
   */
  function DLL() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  DLL.prototype._removeLink = function(node) {
    var prev = node.prev;
    var next = node.next;
    if (prev) {
      prev.next = next;
    } else {
      this.head = next;
    }
    if (next) {
      next.prev = prev;
    } else {
      this.tail = prev;
    }
    node.prev = null;
    node.next = null;
    this.length--;
    return node;
  };

  DLL.prototype.empty = DLL;

  DLL.prototype._setInitial = function(node) {
    this.length = 1;
    this.head = this.tail = node;
  };

  DLL.prototype.insertBefore = function(node, newNode) {
    newNode.prev = node.prev;
    newNode.next = node;
    if (node.prev) {
      node.prev.next = newNode;
    } else {
      this.head = newNode;
    }
    node.prev = newNode;
    this.length++;
  };

  DLL.prototype.unshift = function(node) {
    if (this.head) {
      this.insertBefore(this.head, node);
    } else {
      this._setInitial(node);
    }
  };

  DLL.prototype.push = function(node) {
    var tail = this.tail;
    if (tail) {
      node.prev = tail;
      node.next = tail.next;
      this.tail = node;
      tail.next = node;
      this.length++;
    } else {
      this._setInitial(node);
    }
  };

  DLL.prototype.shift = function() {
    return this.head && this._removeLink(this.head);
  };

  DLL.prototype.splice = function(end) {
    var task;
    var tasks = [];
    while (end-- && (task = this.shift())) {
      tasks.push(task);
    }
    return tasks;
  };

  DLL.prototype.remove = function(test) {
    var node = this.head;
    while (node) {
      if (test(node)) {
        this._removeLink(node);
      }
      node = node.next;
    }
    return this;
  };

  /**
   * @private
   */
  function baseQueue(isQueue, worker, concurrency, payload) {
    if (concurrency === undefined) {
      concurrency = 1;
    } else if (isNaN(concurrency) || concurrency < 1) {
      throw new Error('Concurrency must not be zero');
    }

    var workers = 0;
    var workersList = [];
    var _callback, _unshift;

    var q = {
      _tasks: new DLL(),
      concurrency: concurrency,
      payload: payload,
      saturated: noop,
      unsaturated: noop,
      buffer: concurrency / 4,
      empty: noop,
      drain: noop,
      error: noop,
      started: false,
      paused: false,
      push: push,
      kill: kill,
      unshift: unshift,
      remove: remove,
      process: isQueue ? runQueue : runCargo,
      length: getLength,
      running: running,
      workersList: getWorkersList,
      idle: idle,
      pause: pause,
      resume: resume,
      _worker: worker
    };
    return q;

    function push(tasks, callback) {
      _insert(tasks, callback);
    }

    function unshift(tasks, callback) {
      _insert(tasks, callback, true);
    }

    function _exec(task) {
      var item = {
        data: task,
        callback: _callback
      };
      if (_unshift) {
        q._tasks.unshift(item);
      } else {
        q._tasks.push(item);
      }
      nextTick(q.process);
    }

    function _insert(tasks, callback, unshift) {
      if (callback == null) {
        callback = noop;
      } else if (typeof callback !== 'function') {
        throw new Error('task callback must be a function');
      }
      q.started = true;
      var _tasks = isArray(tasks) ? tasks : [tasks];

      if (tasks === undefined || !_tasks.length) {
        if (q.idle()) {
          nextTick(q.drain);
        }
        return;
      }

      _unshift = unshift;
      _callback = callback;
      arrayEachSync(_tasks, _exec);
      // Avoid leaking the callback
      _callback = undefined;
    }

    function kill() {
      q.drain = noop;
      q._tasks.empty();
    }

    function _next(q, tasks) {
      var called = false;
      return function done(err, res) {
        if (called) {
          throwError();
        }
        called = true;

        workers--;
        var task;
        var index = -1;
        var size = workersList.length;
        var taskIndex = -1;
        var taskSize = tasks.length;
        var useApply = arguments.length > 2;
        var args = useApply && createArray(arguments);
        while (++taskIndex < taskSize) {
          task = tasks[taskIndex];
          while (++index < size) {
            if (workersList[index] === task) {
              if (index === 0) {
                workersList.shift();
              } else {
                workersList.splice(index, 1);
              }
              index = size;
              size--;
            }
          }
          index = -1;
          if (useApply) {
            task.callback.apply(task, args);
          } else {
            task.callback(err, res);
          }
          if (err) {
            q.error(err, task.data);
          }
        }

        if (workers <= q.concurrency - q.buffer) {
          q.unsaturated();
        }

        if (q._tasks.length + workers === 0) {
          q.drain();
        }
        q.process();
      };
    }

    function runQueue() {
      while (!q.paused && workers < q.concurrency && q._tasks.length) {
        var task = q._tasks.shift();
        workers++;
        workersList.push(task);
        if (q._tasks.length === 0) {
          q.empty();
        }
        if (workers === q.concurrency) {
          q.saturated();
        }
        var done = _next(q, [task]);
        worker(task.data, done);
      }
    }

    function runCargo() {
      while (!q.paused && workers < q.concurrency && q._tasks.length) {
        var tasks = q._tasks.splice(q.payload || q._tasks.length);
        var index = -1;
        var size = tasks.length;
        var data = Array(size);
        while (++index < size) {
          data[index] = tasks[index].data;
        }
        workers++;
        nativePush.apply(workersList, tasks);
        if (q._tasks.length === 0) {
          q.empty();
        }
        if (workers === q.concurrency) {
          q.saturated();
        }
        var done = _next(q, tasks);
        worker(data, done);
      }
    }

    function getLength() {
      return q._tasks.length;
    }

    function running() {
      return workers;
    }

    function getWorkersList() {
      return workersList;
    }

    function idle() {
      return q.length() + workers === 0;
    }

    function pause() {
      q.paused = true;
    }

    function _resume() {
      nextTick(q.process);
    }

    function resume() {
      if (q.paused === false) {
        return;
      }
      q.paused = false;
      var count = q.concurrency < q._tasks.length ? q.concurrency : q._tasks.length;
      timesSync(count, _resume);
    }

    /**
     * @param {Function} test
     */
    function remove(test) {
      q._tasks.remove(test);
    }
  }

  /**
   * @memberof async
   * @namespace queue
   */
  function queue(worker, concurrency) {
    return baseQueue(true, worker, concurrency);
  }

  /**
   * @memberof async
   * @namespace priorityQueue
   */
  function priorityQueue(worker, concurrency) {
    var q = baseQueue(true, worker, concurrency);
    q.push = push;
    delete q.unshift;
    return q;

    function push(tasks, priority, callback) {
      q.started = true;
      priority = priority || 0;
      var _tasks = isArray(tasks) ? tasks : [tasks];
      var taskSize = _tasks.length;

      if (tasks === undefined || taskSize === 0) {
        if (q.idle()) {
          nextTick(q.drain);
        }
        return;
      }

      callback = typeof callback === func ? callback : noop;
      var nextNode = q._tasks.head;
      while (nextNode && priority >= nextNode.priority) {
        nextNode = nextNode.next;
      }
      while (taskSize--) {
        var item = {
          data: _tasks[taskSize],
          priority: priority,
          callback: callback
        };
        if (nextNode) {
          q._tasks.insertBefore(nextNode, item);
        } else {
          q._tasks.push(item);
        }
        nextTick(q.process);
      }
    }
  }

  /**
   * @memberof async
   * @namespace cargo
   */
  function cargo(worker, payload) {
    return baseQueue(false, worker, 1, payload);
  }

  /**
   * @memberof async
   * @namespace auto
   * @param {Object} tasks
   * @param {number} [concurrency]
   * @param {Function} [callback]
   */
  function auto(tasks, concurrency, callback) {
    if (typeof concurrency === func) {
      callback = concurrency;
      concurrency = null;
    }
    var keys = nativeKeys(tasks);
    var rest = keys.length;
    var results = {};
    if (rest === 0) {
      return callback(null, results);
    }
    var runningTasks = 0;
    var readyTasks = new DLL();
    var listeners = Object.create(null);
    callback = onlyOnce(callback || noop);
    concurrency = concurrency || rest;

    baseEachSync(tasks, iterator, keys);
    proceedQueue();

    function iterator(task, key) {
      // no dependencies
      var _task, _taskSize;
      if (!isArray(task)) {
        _task = task;
        _taskSize = 0;
        readyTasks.push([_task, _taskSize, done]);
        return;
      }
      var dependencySize = task.length - 1;
      _task = task[dependencySize];
      _taskSize = dependencySize;
      if (dependencySize === 0) {
        readyTasks.push([_task, _taskSize, done]);
        return;
      }
      // dependencies
      var index = -1;
      while (++index < dependencySize) {
        var dependencyName = task[index];
        if (notInclude(keys, dependencyName)) {
          var msg =
            'async.auto task `' +
            key +
            '` has non-existent dependency `' +
            dependencyName +
            '` in ' +
            task.join(', ');
          throw new Error(msg);
        }
        var taskListeners = listeners[dependencyName];
        if (!taskListeners) {
          taskListeners = listeners[dependencyName] = [];
        }
        taskListeners.push(taskListener);
      }

      function done(err, arg) {
        if (key === null) {
          throwError();
        }
        arg = arguments.length <= 2 ? arg : slice(arguments, 1);
        if (err) {
          rest = 0;
          runningTasks = 0;
          readyTasks.length = 0;
          var safeResults = objectClone(results);
          safeResults[key] = arg;
          key = null;
          var _callback = callback;
          callback = noop;
          _callback(err, safeResults);
          return;
        }
        runningTasks--;
        rest--;
        results[key] = arg;
        taskComplete(key);
        key = null;
      }

      function taskListener() {
        if (--dependencySize === 0) {
          readyTasks.push([_task, _taskSize, done]);
        }
      }
    }

    function proceedQueue() {
      if (readyTasks.length === 0 && runningTasks === 0) {
        if (rest !== 0) {
          throw new Error('async.auto task has cyclic dependencies');
        }
        return callback(null, results);
      }
      while (readyTasks.length && runningTasks < concurrency && callback !== noop) {
        runningTasks++;
        var array = readyTasks.shift();
        if (array[1] === 0) {
          array[0](array[2]);
        } else {
          array[0](results, array[2]);
        }
      }
    }

    function taskComplete(key) {
      var taskListeners = listeners[key] || [];
      arrayEachSync(taskListeners, function(task) {
        task();
      });
      proceedQueue();
    }
  }

  var FN_ARGS = /^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m;
  var FN_ARG_SPLIT = /,/;
  var FN_ARG = /(=.+)?(\s*)$/;
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;

  /**
   * parse function arguments for `autoInject`
   *
   * @private
   */
  function parseParams(func) {
    func = func.toString().replace(STRIP_COMMENTS, '');
    func = func.match(FN_ARGS)[2].replace(' ', '');
    func = func ? func.split(FN_ARG_SPLIT) : [];
    func = func.map(function(arg) {
      return arg.replace(FN_ARG, '').trim();
    });
    return func;
  }

  /**
   * @memberof async
   * @namespace autoInject
   * @param {Object} tasks
   * @param {number} [concurrency]
   * @param {Function} [callback]
   */
  function autoInject(tasks, concurrency, callback) {
    var newTasks = {};
    baseEachSync(tasks, iterator, nativeKeys(tasks));
    auto(newTasks, concurrency, callback);

    function iterator(task, key) {
      var params;
      var taskLength = task.length;

      if (isArray(task)) {
        if (taskLength === 0) {
          throw new Error('autoInject task functions require explicit parameters.');
        }
        params = createArray(task);
        taskLength = params.length - 1;
        task = params[taskLength];
        if (taskLength === 0) {
          newTasks[key] = task;
          return;
        }
      } else if (taskLength === 1) {
        newTasks[key] = task;
        return;
      } else {
        params = parseParams(task);
        if (taskLength === 0 && params.length === 0) {
          throw new Error('autoInject task functions require explicit parameters.');
        }
        taskLength = params.length - 1;
      }
      params[taskLength] = newTask;
      newTasks[key] = params;

      function newTask(results, done) {
        switch (taskLength) {
          case 1:
            task(results[params[0]], done);
            break;
          case 2:
            task(results[params[0]], results[params[1]], done);
            break;
          case 3:
            task(results[params[0]], results[params[1]], results[params[2]], done);
            break;
          default:
            var i = -1;
            while (++i < taskLength) {
              params[i] = results[params[i]];
            }
            params[i] = done;
            task.apply(null, params);
            break;
        }
      }
    }
  }

  /**
   * @memberof async
   * @namespace retry
   * @param {integer|Object|Function} opts
   * @param {Function} [task]
   * @param {Function} [callback]
   */
  function retry(opts, task, callback) {
    var times, intervalFunc, errorFilter;
    var count = 0;
    if (arguments.length < 3 && typeof opts === func) {
      callback = task || noop;
      task = opts;
      opts = null;
      times = DEFAULT_TIMES;
    } else {
      callback = callback || noop;
      switch (typeof opts) {
        case 'object':
          if (typeof opts.errorFilter === func) {
            errorFilter = opts.errorFilter;
          }
          var interval = opts.interval;
          switch (typeof interval) {
            case func:
              intervalFunc = interval;
              break;
            case 'string':
            case 'number':
              interval = +interval;
              intervalFunc = interval
                ? function() {
                    return interval;
                  }
                : function() {
                    return DEFAULT_INTERVAL;
                  };
              break;
          }
          times = +opts.times || DEFAULT_TIMES;
          break;
        case 'number':
          times = opts || DEFAULT_TIMES;
          break;
        case 'string':
          times = +opts || DEFAULT_TIMES;
          break;
        default:
          throw new Error('Invalid arguments for async.retry');
      }
    }
    if (typeof task !== 'function') {
      throw new Error('Invalid arguments for async.retry');
    }

    if (intervalFunc) {
      task(intervalCallback);
    } else {
      task(simpleCallback);
    }

    function simpleIterator() {
      task(simpleCallback);
    }

    function simpleCallback(err, res) {
      if (++count === times || !err || (errorFilter && !errorFilter(err))) {
        if (arguments.length <= 2) {
          return callback(err, res);
        }
        var args = createArray(arguments);
        return callback.apply(null, args);
      }
      simpleIterator();
    }

    function intervalIterator() {
      task(intervalCallback);
    }

    function intervalCallback(err, res) {
      if (++count === times || !err || (errorFilter && !errorFilter(err))) {
        if (arguments.length <= 2) {
          return callback(err, res);
        }
        var args = createArray(arguments);
        return callback.apply(null, args);
      }
      setTimeout(intervalIterator, intervalFunc(count));
    }
  }

  function retryable(opts, task) {
    if (!task) {
      task = opts;
      opts = null;
    }
    return done;

    function done() {
      var taskFn;
      var args = createArray(arguments);
      var lastIndex = args.length - 1;
      var callback = args[lastIndex];
      switch (task.length) {
        case 1:
          taskFn = task1;
          break;
        case 2:
          taskFn = task2;
          break;
        case 3:
          taskFn = task3;
          break;
        default:
          taskFn = task4;
      }
      if (opts) {
        retry(opts, taskFn, callback);
      } else {
        retry(taskFn, callback);
      }

      function task1(done) {
        task(done);
      }

      function task2(done) {
        task(args[0], done);
      }

      function task3(done) {
        task(args[0], args[1], done);
      }

      function task4(callback) {
        args[lastIndex] = callback;
        task.apply(null, args);
      }
    }
  }

  /**
   * @memberof async
   * @namespace iterator
   */
  function iterator(tasks) {
    var size = 0;
    var keys = [];
    if (isArray(tasks)) {
      size = tasks.length;
    } else {
      keys = nativeKeys(tasks);
      size = keys.length;
    }
    return makeCallback(0);

    function makeCallback(index) {
      var fn = function() {
        if (size) {
          var key = keys[index] || index;
          tasks[key].apply(null, createArray(arguments));
        }
        return fn.next();
      };
      fn.next = function() {
        return index < size - 1 ? makeCallback(index + 1) : null;
      };
      return fn;
    }
  }

  /**
   * @memberof async
   * @namespace apply
   */
  function apply(func) {
    switch (arguments.length) {
      case 0:
      case 1:
        return func;
      case 2:
        return func.bind(null, arguments[1]);
      case 3:
        return func.bind(null, arguments[1], arguments[2]);
      case 4:
        return func.bind(null, arguments[1], arguments[2], arguments[3]);
      case 5:
        return func.bind(null, arguments[1], arguments[2], arguments[3], arguments[4]);
      default:
        var size = arguments.length;
        var index = 0;
        var args = Array(size);
        args[index] = null;
        while (++index < size) {
          args[index] = arguments[index];
        }
        return func.bind.apply(func, args);
    }
  }

  /**
   * @memberof async
   * @namespace timeout
   * @param {Function} func
   * @param {number} millisec
   * @param {*} info
   */
  function timeout(func, millisec, info) {
    var callback, timer;
    return wrappedFunc;

    function wrappedFunc() {
      timer = setTimeout(timeoutCallback, millisec);
      var args = createArray(arguments);
      var lastIndex = args.length - 1;
      callback = args[lastIndex];
      args[lastIndex] = injectedCallback;
      simpleApply(func, args);
    }

    function timeoutCallback() {
      var name = func.name || 'anonymous';
      var err = new Error('Callback function "' + name + '" timed out.');
      err.code = 'ETIMEDOUT';
      if (info) {
        err.info = info;
      }
      timer = null;
      callback(err);
    }

    function injectedCallback() {
      if (timer !== null) {
        simpleApply(callback, createArray(arguments));
        clearTimeout(timer);
      }
    }

    function simpleApply(func, args) {
      switch (args.length) {
        case 0:
          func();
          break;
        case 1:
          func(args[0]);
          break;
        case 2:
          func(args[0], args[1]);
          break;
        default:
          func.apply(null, args);
          break;
      }
    }
  }

  /**
   * @memberof async
   * @namespace times
   * @param {number} n - n >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * var iterator = function(n, done) {
   *   done(null, n);
   * };
   * async.times(4, iterator, function(err, res) {
   *   console.log(res); // [0, 1, 2, 3];
   * });
   *
   */
  function times(n, iterator, callback) {
    callback = callback || noop;
    n = +n;
    if (isNaN(n) || n < 1) {
      return callback(null, []);
    }
    var result = Array(n);
    timesSync(n, iterate);

    function iterate(num) {
      iterator(num, createCallback(num));
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        result[index] = res;
        index = null;
        if (err) {
          callback(err);
          callback = noop;
        } else if (--n === 0) {
          callback(null, result);
        }
      };
    }
  }

  /**
   * @memberof async
   * @namespace timesSeries
   * @param {number} n - n >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * var iterator = function(n, done) {
   *   done(null, n);
   * };
   * async.timesSeries(4, iterator, function(err, res) {
   *   console.log(res); // [0, 1, 2, 3];
   * });
   *
   */
  function timesSeries(n, iterator, callback) {
    callback = callback || noop;
    n = +n;
    if (isNaN(n) || n < 1) {
      return callback(null, []);
    }
    var result = Array(n);
    var sync = false;
    var completed = 0;
    iterate();

    function iterate() {
      iterator(completed, done);
    }

    function done(err, res) {
      result[completed] = res;
      if (err) {
        callback(err);
        callback = throwError;
      } else if (++completed >= n) {
        callback(null, result);
        callback = throwError;
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace timesLimit
   * @param {number} n - n >= 1
   * @param {number} limit - n >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * var iterator = function(n, done) {
   *   done(null, n);
   * };
   * async.timesLimit(4, 2, iterator, function(err, res) {
   *   console.log(res); // [0, 1, 2, 3];
   * });
   *
   */
  function timesLimit(n, limit, iterator, callback) {
    callback = callback || noop;
    n = +n;
    if (isNaN(n) || n < 1 || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    var result = Array(n);
    var sync = false;
    var started = 0;
    var completed = 0;
    timesSync(limit > n ? n : limit, iterate);

    function iterate() {
      var index = started++;
      if (index < n) {
        iterator(index, createCallback(index));
      }
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        result[index] = res;
        index = null;
        if (err) {
          callback(err);
          callback = noop;
        } else if (++completed >= n) {
          callback(null, result);
          callback = throwError;
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace race
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * // array
   * var called = 0;
   * var tasks = [
   *   function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '1');
   *     }, 30);
   *   },
   *   function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '2');
   *     }, 20);
   *   },
   *   function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '3');
   *     }, 10);
   *   }
   * ];
   * async.race(tasks, function(err, res) {
   *   console.log(res); // '3'
   *   console.log(called); // 1
   *   setTimeout(function() {
   *     console.log(called); // 3
   *   }, 50);
   * });
   *
   * @example
   *
   * // object
   * var called = 0;
   * var tasks = {
   *   'test1': function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '1');
   *     }, 30);
   *   },
   *   'test2': function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '2');
   *     }, 20);
   *   },
   *   'test3': function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '3');
   *     }, 10);
   *   }
   * };
   * async.race(tasks, function(err, res) {
   *   console.log(res); // '3'
   *   console.log(called); // 1
   *   setTimeout(function() {
   *     console.log(called); // 3
   *     done();
   *   }, 50);
   * });
   *
   */
  function race(tasks, callback) {
    callback = once(callback || noop);
    var size, keys;
    var index = -1;
    if (isArray(tasks)) {
      size = tasks.length;
      while (++index < size) {
        tasks[index](callback);
      }
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      while (++index < size) {
        tasks[keys[index]](callback);
      }
    } else {
      return callback(new TypeError('First argument to race must be a collection of functions'));
    }
    if (!size) {
      callback(null);
    }
  }

  /**
   * @memberof async
   * @namespace memoize
   */
  function memoize(fn, hasher) {
    hasher =
      hasher ||
      function(hash) {
        return hash;
      };

    var memo = {};
    var queues = {};
    var memoized = function() {
      var args = createArray(arguments);
      var callback = args.pop();
      var key = hasher.apply(null, args);
      if (has(memo, key)) {
        nextTick(function() {
          callback.apply(null, memo[key]);
        });
        return;
      }
      if (has(queues, key)) {
        return queues[key].push(callback);
      }

      queues[key] = [callback];
      args.push(done);
      fn.apply(null, args);

      function done(err) {
        var args = createArray(arguments);
        if (!err) {
          memo[key] = args;
        }
        var q = queues[key];
        delete queues[key];

        var i = -1;
        var size = q.length;
        while (++i < size) {
          q[i].apply(null, args);
        }
      }
    };
    memoized.memo = memo;
    memoized.unmemoized = fn;
    return memoized;
  }

  /**
   * @memberof async
   * @namespace unmemoize
   */
  function unmemoize(fn) {
    return function() {
      return (fn.unmemoized || fn).apply(null, arguments);
    };
  }

  /**
   * @memberof async
   * @namespace ensureAsync
   */
  function ensureAsync(fn) {
    return function(/* ...args, callback */) {
      var args = createArray(arguments);
      var lastIndex = args.length - 1;
      var callback = args[lastIndex];
      var sync = true;
      args[lastIndex] = done;
      fn.apply(this, args);
      sync = false;

      function done() {
        var innerArgs = createArray(arguments);
        if (sync) {
          nextTick(function() {
            callback.apply(null, innerArgs);
          });
        } else {
          callback.apply(null, innerArgs);
        }
      }
    };
  }

  /**
   * @memberof async
   * @namespace constant
   */
  function constant(/* values... */) {
    var args = [null].concat(createArray(arguments));
    return function(callback) {
      callback = arguments[arguments.length - 1];
      callback.apply(this, args);
    };
  }

  function asyncify(fn) {
    return function(/* args..., callback */) {
      var args = createArray(arguments);
      var callback = args.pop();
      var result;
      try {
        result = fn.apply(this, args);
      } catch (e) {
        return callback(e);
      }
      if (result && typeof result.then === func) {
        result.then(
          function(value) {
            invokeCallback(callback, null, value);
          },
          function(err) {
            invokeCallback(callback, err && err.message ? err : new Error(err));
          }
        );
      } else {
        callback(null, result);
      }
    };
  }

  function invokeCallback(callback, err, value) {
    try {
      callback(err, value);
    } catch (e) {
      nextTick(rethrow, e);
    }
  }

  function rethrow(error) {
    throw error;
  }

  /**
   * @memberof async
   * @namespace reflect
   * @param {Function} func
   * @return {Function}
   */
  function reflect(func) {
    return function(/* args..., callback */) {
      var callback;
      switch (arguments.length) {
        case 1:
          callback = arguments[0];
          return func(done);
        case 2:
          callback = arguments[1];
          return func(arguments[0], done);
        default:
          var args = createArray(arguments);
          var lastIndex = args.length - 1;
          callback = args[lastIndex];
          args[lastIndex] = done;
          func.apply(this, args);
      }

      function done(err, res) {
        if (err) {
          return callback(null, {
            error: err
          });
        }
        if (arguments.length > 2) {
          res = slice(arguments, 1);
        }
        callback(null, {
          value: res
        });
      }
    };
  }

  /**
   * @memberof async
   * @namespace reflectAll
   * @param {Array[]|Object} tasks
   * @return {Function}
   */
  function reflectAll(tasks) {
    var newTasks, keys;
    if (isArray(tasks)) {
      newTasks = Array(tasks.length);
      arrayEachSync(tasks, iterate);
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      newTasks = {};
      baseEachSync(tasks, iterate, keys);
    }
    return newTasks;

    function iterate(func, key) {
      newTasks[key] = reflect(func);
    }
  }

  /**
   * @memberof async
   * @namespace createLogger
   */
  function createLogger(name) {
    return function(fn) {
      var args = slice(arguments, 1);
      args.push(done);
      fn.apply(null, args);
    };

    function done(err) {
      if (typeof console === obj) {
        if (err) {
          if (console.error) {
            console.error(err);
          }
          return;
        }
        if (console[name]) {
          var args = slice(arguments, 1);
          arrayEachSync(args, function(arg) {
            console[name](arg);
          });
        }
      }
    }
  }

  /**
   * @memberof async
   * @namespace safe
   */
  function safe() {
    createImmediate();
    return exports;
  }

  /**
   * @memberof async
   * @namespace fast
   */
  function fast() {
    createImmediate(false);
    return exports;
  }
});


/***/ }),

/***/ 977:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * node-sass: lib/binding.js
 */

var errors = __webpack_require__(415);

/**
 * Require binding
 */
module.exports = function(ext) {
  if (!ext.hasBinary(ext.getBinaryPath())) {
    if (!ext.isSupportedEnvironment()) {
      throw new Error(errors.unsupportedEnvironment());
    } else {
      throw new Error(errors.missingBinary());
    }
  }

  return require(ext.getBinaryPath());
};


/***/ }),

/***/ 415:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * node-sass: lib/errors.js
 */

var sass = __webpack_require__(185),
  pkg = __webpack_require__(1246);

function humanEnvironment() {
  return sass.getHumanEnvironment(sass.getBinaryName());
}

function foundBinaries() {
  return [
    'Found bindings for the following environments:',
    foundBinariesList(),
  ].join('\n');
}

function foundBinariesList() {
  return sass.getInstalledBinaries().map(function(env) {
    return '  - ' + sass.getHumanEnvironment(env);
  }).join('\n');
}

function missingBinaryFooter() {
  return [
    'This usually happens because your environment has changed since running `npm install`.',
    'Run `npm rebuild node-sass` to download the binding for your current environment.',
  ].join('\n');
}

module.exports.unsupportedEnvironment = function() {
  return [
    'Node Sass does not yet support your current environment: ' + humanEnvironment(),
    'For more information on which environments are supported please see:',
    'https://github.com/sass/node-sass/releases/tag/v' + pkg.version
  ].join('\n');
};

module.exports.missingBinary = function() {
  return [
    'Missing binding ' + sass.getBinaryPath(),
    'Node Sass could not find a binding for your current environment: ' + humanEnvironment(),
    '',
    foundBinaries(),
    '',
    missingBinaryFooter(),
  ].join('\n');
};


/***/ }),

/***/ 185:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * node-sass: lib/extensions.js
 */

var eol = __webpack_require__(2087).EOL,
  fs = __webpack_require__(5747),
  pkg = __webpack_require__(1246),
  mkdir = __webpack_require__(6186),
  path = __webpack_require__(5622),
  defaultBinaryDir = __webpack_require__.ab + "vendor",
  trueCasePathSync = __webpack_require__(6979);

/**
 * Get the human readable name of the Platform that is running
 *
 * @param  {string} platform - An OS platform to match, or null to fallback to
 * the current process platform
 * @return {Object} The name of the platform if matched, false otherwise
 *
 * @api public
 */
function getHumanPlatform(platform) {
  switch (platform || process.platform) {
    case 'darwin': return 'OS X';
    case 'freebsd': return 'FreeBSD';
    case 'linux': return 'Linux';
    case 'linux_musl': return 'Linux/musl';
    case 'win32': return 'Windows';
    default: return false;
  }
}

/**
 * Provides a more readable version of the architecture
 *
 * @param  {string} arch - An instruction architecture name to match, or null to
 * lookup the current process architecture
 * @return {Object} The value of the process architecture, or false if unknown
 *
 * @api public
 */
function getHumanArchitecture(arch) {
  switch (arch || process.arch) {
    case 'ia32': return '32-bit';
    case 'x86': return '32-bit';
    case 'x64': return '64-bit';
    default: return false;
  }
}

/**
 * Get the friendly name of the Node environment being run
 *
 * @param  {Object} abi - A Node Application Binary Interface value, or null to
 * fallback to the current Node ABI
 * @return {Object} Returns a string name of the Node environment or false if
 * unmatched
 *
 * @api public
 */
function getHumanNodeVersion(abi) {
  switch (parseInt(abi || process.versions.modules, 10)) {
    case 11: return 'Node 0.10.x';
    case 14: return 'Node 0.12.x';
    case 42: return 'io.js 1.x';
    case 43: return 'io.js 1.1.x';
    case 44: return 'io.js 2.x';
    case 45: return 'io.js 3.x';
    case 46: return 'Node.js 4.x';
    case 47: return 'Node.js 5.x';
    case 48: return 'Node.js 6.x';
    case 49: return 'Electron 1.3.x';
    case 50: return 'Electron 1.4.x';
    case 51: return 'Node.js 7.x';
    case 53: return 'Electron 1.6.x';
    case 57: return 'Node.js 8.x';
    case 59: return 'Node.js 9.x';
    case 64: return 'Node.js 10.x';
    case 67: return 'Node.js 11.x';
    case 72: return 'Node.js 12.x';
    case 79: return 'Node.js 13.x';
    case 83: return 'Node.js 14.x';
    default: return false;
  }
}

/**
 * Get a human readable description of where node-sass is running to support
 * user error reporting when something goes wrong
 *
 * @param  {string} env - The name of the native bindings that is to be parsed
 * @return {string} A description of what os, architecture, and Node version
 * that is being run
 *
 * @api public
 */
function getHumanEnvironment(env) {
  var binding = env.replace(/_binding\.node$/, ''),
    parts = binding.split('-'),
    platform = getHumanPlatform(parts[0]),
    arch = getHumanArchitecture(parts[1]),
    runtime = getHumanNodeVersion(parts[2]);

  if (parts.length !== 3) {
    return 'Unknown environment (' + binding + ')';
  }

  if (!platform) {
    platform = 'Unsupported platform (' + parts[0] + ')';
  }

  if (!arch) {
    arch = 'Unsupported architecture (' + parts[1] + ')';
  }

  if (!runtime) {
    runtime = 'Unsupported runtime (' + parts[2] + ')';
  }

  return [
    platform, arch, 'with', runtime,
  ].join(' ');
}

/**
 * Get the value of the binaries under the default path
 *
 * @return {Array} The currently installed node-sass bindings
 *
 * @api public
 */
function getInstalledBinaries() {
  return fs.readdirSync(getBinaryDir());
}

/**
 * Check that an environment matches the whitelisted values or the current
 * environment if no parameters are passed
 *
 * @param  {string} platform - The name of the OS platform(darwin, win32, etc...)
 * @param  {string} arch - The instruction set architecture of the Node environment
 * @param  {string} abi - The Node Application Binary Interface
 * @return {Boolean} True, if node-sass supports the current platform, false otherwise
 *
 * @api public
 */
function isSupportedEnvironment(platform, arch, abi) {
  return (
    false !== getHumanPlatform(platform) &&
    false !== getHumanArchitecture(arch) &&
    false !== getHumanNodeVersion(abi)
  );
}

/**
 * Get the value of a CLI argument
 *
 * @param {String} name
 * @param {Array} args
 * @api private
 */

function getArgument(name, args) {
  var flags = args || process.argv.slice(2),
    index = flags.lastIndexOf(name);

  if (index === -1 || index + 1 >= flags.length) {
    return null;
  }

  return flags[index + 1];
}

/**
 * Get binary name.
 * If environment variable SASS_BINARY_NAME,
 * .npmrc variable sass_binary_name or
 * process argument --binary-name is provided,
 * return it as is, otherwise make default binary
 * name: {platform}-{arch}-{v8 version}.node
 *
 * @api public
 */

function getBinaryName() {
  var binaryName,
    variant,
    platform = process.platform;

  if (getArgument('--sass-binary-name')) {
    binaryName = getArgument('--sass-binary-name');
  } else if (process.env.SASS_BINARY_NAME) {
    binaryName = process.env.SASS_BINARY_NAME;
  } else if (process.env.npm_config_sass_binary_name) {
    binaryName = process.env.npm_config_sass_binary_name;
  } else if (pkg.nodeSassConfig && pkg.nodeSassConfig.binaryName) {
    binaryName = pkg.nodeSassConfig.binaryName;
  } else {
    variant = getPlatformVariant();
    if (variant) {
      platform += '_' + variant;
    }

    binaryName = [
      platform, '-',
      process.arch, '-',
      process.versions.modules
    ].join('');
  }

  return [binaryName, 'binding.node'].join('_');
}

/**
 * Determine the URL to fetch binary file from.
 * By default fetch from the node-sass distribution
 * site on GitHub.
 *
 * The default URL can be overridden using
 * the environment variable SASS_BINARY_SITE,
 * .npmrc variable sass_binary_site or
 * or a command line option --sass-binary-site:
 *
 *   node scripts/install.js --sass-binary-site http://example.com/
 *
 * The URL should to the mirror of the repository
 * laid out as follows:
 *
 * SASS_BINARY_SITE/
 *
 *  v3.0.0
 *  v3.0.0/freebsd-x64-14_binding.node
 *  ....
 *  v3.0.0
 *  v3.0.0/freebsd-ia32-11_binding.node
 *  v3.0.0/freebsd-x64-42_binding.node
 *  ... etc. for all supported versions and platforms
 *
 * @api public
 */

function getBinaryUrl() {
  var site = getArgument('--sass-binary-site') ||
             process.env.SASS_BINARY_SITE  ||
             process.env.npm_config_sass_binary_site ||
             (pkg.nodeSassConfig && pkg.nodeSassConfig.binarySite) ||
             'https://github.com/sass/node-sass/releases/download';

  return [site, 'v' + pkg.version, getBinaryName()].join('/');
}

/**
 * Get binary dir.
 * If environment variable SASS_BINARY_DIR,
 * .npmrc variable sass_binary_dir or
 * process argument --sass-binary-dir is provided,
 * select it by appending binary name, otherwise
 * use default binary dir.
 * Once the primary selection is made, check if
 * callers wants to throw if file not exists before
 * returning.
 *
 * @api public
 */

function getBinaryDir() {
  var binaryDir;

  if (getArgument('--sass-binary-dir')) {
    binaryDir = getArgument('--sass-binary-dir');
  } else if (process.env.SASS_BINARY_DIR) {
    binaryDir = process.env.SASS_BINARY_DIR;
  } else if (process.env.npm_config_sass_binary_dir) {
    binaryDir = process.env.npm_config_sass_binary_dir;
  } else if (pkg.nodeSassConfig && pkg.nodeSassConfig.binaryDir) {
    binaryDir = pkg.nodeSassConfig.binaryDir;
  } else {
    binaryDir = __webpack_require__.ab + "vendor";
  }

  return __webpack_require__.ab + "vendor";
}

/**
 * Get binary path.
 * If environment variable SASS_BINARY_PATH,
 * .npmrc variable sass_binary_path or
 * process argument --sass-binary-path is provided,
 * select it by appending binary name, otherwise
 * make default binary path using binary name.
 * Once the primary selection is made, check if
 * callers wants to throw if file not exists before
 * returning.
 *
 * @api public
 */

function getBinaryPath() {
  var binaryPath;

  if (getArgument('--sass-binary-path')) {
    binaryPath = getArgument('--sass-binary-path');
  } else if (process.env.SASS_BINARY_PATH) {
    binaryPath = process.env.SASS_BINARY_PATH;
  } else if (process.env.npm_config_sass_binary_path) {
    binaryPath = process.env.npm_config_sass_binary_path;
  } else if (pkg.nodeSassConfig && pkg.nodeSassConfig.binaryPath) {
    binaryPath = pkg.nodeSassConfig.binaryPath;
  } else {
    binaryPath = path.join(getBinaryDir(), getBinaryName().replace(/_(?=binding\.node)/, '/'));
  }

  if (process.versions.modules < 46) {
    return binaryPath;
  }

  try {
    return trueCasePathSync(binaryPath) || binaryPath;
  } catch (e) {
    return binaryPath;
  }
}

/**
 * An array of paths suitable for use as a local disk cache of the binding.
 *
 * @return {[]String} an array of paths
 * @api public
 */
function getCachePathCandidates() {
  return [
    process.env.npm_config_sass_binary_cache,
    process.env.npm_config_cache,
  ].filter(function(_) { return _; });
}

/**
 * The most suitable location for caching the binding on disk.
 *
 * Given the candidates directories provided by `getCachePathCandidates()` this
 * returns the first writable directory. By treating the candidate directories
 * as a prioritised list this method is deterministic, assuming no change to the
 * local environment.
 *
 * @return {String} directory to cache binding
 * @api public
 */
function getBinaryCachePath() {
  var i,
    cachePath,
    cachePathCandidates = getCachePathCandidates();

  for (i = 0; i < cachePathCandidates.length; i++) {
    cachePath = path.join(cachePathCandidates[i], pkg.name, pkg.version);

    try {
      mkdir.sync(cachePath);
      return cachePath;
    } catch (e) {
      // Directory is not writable, try another
    }
  }

  return '';
}

/**
 * The cached binding
 *
 * Check the candidates directories provided by `getCachePathCandidates()` for
 * the binding file, if it exists. By treating the candidate directories
 * as a prioritised list this method is deterministic, assuming no change to the
 * local environment.
 *
 * @return {String} path to cached binary
 * @api public
 */
function getCachedBinary() {
  var i,
    cachePath,
    cacheBinary,
    cachePathCandidates = getCachePathCandidates(),
    binaryName = getBinaryName();

  for (i = 0; i < cachePathCandidates.length; i++) {
    cachePath = path.join(cachePathCandidates[i], pkg.name, pkg.version);
    cacheBinary = path.join(cachePath, binaryName);

    if (fs.existsSync(cacheBinary)) {
      return cacheBinary;
    }
  }

  return '';
}

/**
 * Does the supplied binary path exist
 *
 * @param {String} binaryPath
 * @api public
 */

function hasBinary(binaryPath) {
  return fs.existsSync(binaryPath);
}

/**
 * Get Sass version information
 *
 * @api public
 */

function getVersionInfo(binding) {
  return [
    ['node-sass', pkg.version, '(Wrapper)', '[JavaScript]'].join('\t'),
    ['libsass  ', binding.libsassVersion(), '(Sass Compiler)', '[C/C++]'].join('\t'),
  ].join(eol);
}

/**
 * Gets the platform variant, currently either an empty string or 'musl' for Linux/musl platforms.
 *
 * @api public
 */

function getPlatformVariant() {
  var contents = '';

  if (process.platform !== 'linux') {
    return '';
  }

  try {
    contents = fs.readFileSync(process.execPath);

    // Buffer.indexOf was added in v1.5.0 so cast to string for old node
    // Delay contents.toStrings because it's expensive
    if (!contents.indexOf) {
      contents = contents.toString();
    }

    if (contents.indexOf('libc.musl-x86_64.so.1') !== -1) {
      return 'musl';
    }
  } catch (err) { } // eslint-disable-line no-empty

  return '';
}

module.exports.hasBinary = hasBinary;
module.exports.getBinaryUrl = getBinaryUrl;
module.exports.getBinaryName = getBinaryName;
module.exports.getBinaryDir = getBinaryDir;
module.exports.getBinaryPath = getBinaryPath;
module.exports.getBinaryCachePath = getBinaryCachePath;
module.exports.getCachedBinary = getCachedBinary;
module.exports.getCachePathCandidates = getCachePathCandidates;
module.exports.getVersionInfo = getVersionInfo;
module.exports.getHumanEnvironment = getHumanEnvironment;
module.exports.getInstalledBinaries = getInstalledBinaries;
module.exports.isSupportedEnvironment = isSupportedEnvironment;


/***/ }),

/***/ 8279:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * node-sass: lib/index.js
 */

var path = __webpack_require__(5622),
  clonedeep = __webpack_require__(2187),
  assign = __webpack_require__(4874),
  sass = __webpack_require__(185);

/**
 * Require binding
 */

var binding = __webpack_require__(977)(sass);

/**
 * Get input file
 *
 * @param {Object} options
 * @api private
 */

function getInputFile(options) {
  return options.file ? path.resolve(options.file) : null;
}

/**
 * Get output file
 *
 * @param {Object} options
 * @api private
 */

function getOutputFile(options) {
  var outFile = options.outFile;

  if (!outFile || typeof outFile !== 'string' || (!options.data && !options.file)) {
    return null;
  }

  return path.resolve(outFile);
}

/**
 * Get source map
 *
 * @param {Object} options
 * @api private
 */

function getSourceMap(options) {
  var sourceMap = options.sourceMap;

  if (sourceMap && typeof sourceMap !== 'string' && options.outFile) {
    sourceMap = options.outFile + '.map';
  }

  return sourceMap && typeof sourceMap === 'string' ? path.resolve(sourceMap) : null;
}

/**
 * Get stats
 *
 * @param {Object} options
 * @api private
 */

function getStats(options) {
  var stats = {};

  stats.entry = options.file || 'data';
  stats.start = Date.now();

  return stats;
}

/**
 * End stats
 *
 * @param {Object} stats
 * @param {Object} sourceMap
 * @api private
 */

function endStats(stats) {
  stats.end = Date.now();
  stats.duration = stats.end - stats.start;

  return stats;
}

/**
 * Get style
 *
 * @param {Object} options
 * @api private
 */

function getStyle(options) {
  var styles = {
    nested: 0,
    expanded: 1,
    compact: 2,
    compressed: 3
  };

  return styles[options.outputStyle] || 0;
}

/**
 * Get indent width
 *
 * @param {Object} options
 * @api private
 */

function getIndentWidth(options) {
  var width = parseInt(options.indentWidth) || 2;

  return width > 10 ? 2 : width;
}

/**
 * Get indent type
 *
 * @param {Object} options
 * @api private
 */

function getIndentType(options) {
  var types = {
    space: 0,
    tab: 1
  };

  return types[options.indentType] || 0;
}

/**
 * Get linefeed
 *
 * @param {Object} options
 * @api private
 */

function getLinefeed(options) {
  var feeds = {
    cr: '\r',
    crlf: '\r\n',
    lf: '\n',
    lfcr: '\n\r'
  };

  return feeds[options.linefeed] || '\n';
}

/**
 * Build an includePaths string
 * from the options.includePaths array and the SASS_PATH environment variable
 *
 * @param {Object} options
 * @api private
 */

function buildIncludePaths(options) {
  options.includePaths = options.includePaths || [];

  if (process.env.hasOwnProperty('SASS_PATH')) {
    options.includePaths = options.includePaths.concat(
      process.env.SASS_PATH.split(path.delimiter)
    );
  }

  // Preserve the behaviour people have come to expect.
  // This behaviour was removed from Sass in 3.4 and
  // LibSass in 3.5.
  options.includePaths.unshift(process.cwd());

  return options.includePaths.join(path.delimiter);
}

/**
 * Get options
 *
 * @param {Object} options
 * @api private
 */

function getOptions(opts, cb) {
  if (typeof opts !== 'object') {
    throw new Error('Invalid: options is not an object.');
  }
  var options = clonedeep(opts || {});

  options.sourceComments = options.sourceComments || false;
  if (options.hasOwnProperty('file')) {
    options.file = getInputFile(options);
  }
  options.outFile = getOutputFile(options);
  options.includePaths = buildIncludePaths(options);
  options.precision = parseInt(options.precision) || 5;
  options.sourceMap = getSourceMap(options);
  options.style = getStyle(options);
  options.indentWidth = getIndentWidth(options);
  options.indentType = getIndentType(options);
  options.linefeed = getLinefeed(options);

  // context object represents node-sass environment
  options.context = { options: options, callback: cb };

  options.result = {
    stats: getStats(options)
  };

  return options;
}

/**
 * Executes a callback and transforms any exception raised into a sass error
 *
 * @param {Function} callback
 * @param {Array} arguments
 * @api private
 */

function tryCallback(callback, args) {
  try {
    return callback.apply(this, args);
  } catch (e) {
    if (typeof e === 'string') {
      return new binding.types.Error(e);
    } else if (e instanceof Error) {
      return new binding.types.Error(e.message);
    } else {
      return new binding.types.Error('An unexpected error occurred');
    }
  }
}

/**
 * Normalizes the signature of custom functions to make it possible to just supply the
 * function name and have the signature default to `fn(...)`. The callback is adjusted
 * to transform the input sass list into discrete arguments.
 *
 * @param {String} signature
 * @param {Function} callback
 * @return {Object}
 * @api private
 */

function normalizeFunctionSignature(signature, callback) {
  if (!/^\*|@warn|@error|@debug|\w+\(.*\)$/.test(signature)) {
    if (!/\w+/.test(signature)) {
      throw new Error('Invalid function signature format "' + signature + '"');
    }

    return {
      signature: signature + '(...)',
      callback: function() {
        var args = Array.prototype.slice.call(arguments),
          list = args.shift(),
          i;

        for (i = list.getLength() - 1; i >= 0; i--) {
          args.unshift(list.getValue(i));
        }

        return callback.apply(this, args);
      }
    };
  }

  return {
    signature: signature,
    callback: callback
  };
}

/**
 * Render
 *
 * @param {Object} options
 * @api public
 */

module.exports.render = function(opts, cb) {
  var options = getOptions(opts, cb);

  // options.error and options.success are for libsass binding
  options.error = function(err) {
    var payload = assign(new Error(), JSON.parse(err));

    if (cb) {
      options.context.callback.call(options.context, payload, null);
    }
  };

  options.success = function() {
    var result = options.result;
    var stats = endStats(result.stats);
    var payload = {
      css: result.css,
      stats: stats
    };
    if (result.map) {
      payload.map = result.map;
    }

    if (cb) {
      options.context.callback.call(options.context, null, payload);
    }
  };

  var importer = options.importer;

  if (importer) {
    if (Array.isArray(importer)) {
      options.importer = [];
      importer.forEach(function(subject, index) {
        options.importer[index] = function(file, prev, bridge) {
          function done(result) {
            bridge.success(result === module.exports.NULL ? null : result);
          }

          var result = subject.call(options.context, file, prev, done);

          if (result !== undefined) {
            done(result);
          }
        };
      });
    } else {
      options.importer = function(file, prev, bridge) {
        function done(result) {
          bridge.success(result === module.exports.NULL ? null : result);
        }

        var result = importer.call(options.context, file, prev, done);

        if (result !== undefined) {
          done(result);
        }
      };
    }
  }

  var functions = clonedeep(options.functions);

  if (functions) {
    options.functions = {};

    Object.keys(functions).forEach(function(subject) {
      var cb = normalizeFunctionSignature(subject, functions[subject]);

      options.functions[cb.signature] = function() {
        var args = Array.prototype.slice.call(arguments),
          bridge = args.pop();

        function done(data) {
          bridge.success(data);
        }

        var result = tryCallback(cb.callback.bind(options.context), args.concat(done));

        if (result) {
          done(result);
        }
      };
    });
  }

  if (options.data) {
    binding.render(options);
  } else if (options.file) {
    binding.renderFile(options);
  } else {
    cb({status: 3, message: 'No input specified: provide a file name or a source string to process' });
  }
};

/**
 * Render sync
 *
 * @param {Object} options
 * @api public
 */

module.exports.renderSync = function(opts) {
  var options = getOptions(opts);
  var importer = options.importer;

  if (importer) {
    if (Array.isArray(importer)) {
      options.importer = [];
      importer.forEach(function(subject, index) {
        options.importer[index] = function(file, prev) {
          var result = subject.call(options.context, file, prev);

          return result === module.exports.NULL ? null : result;
        };
      });
    } else {
      options.importer = function(file, prev) {
        var result = importer.call(options.context, file, prev);

        return result === module.exports.NULL ? null : result;
      };
    }
  }

  var functions = clonedeep(options.functions);

  if (options.functions) {
    options.functions = {};

    Object.keys(functions).forEach(function(signature) {
      var cb = normalizeFunctionSignature(signature, functions[signature]);

      options.functions[cb.signature] = function() {
        return tryCallback(cb.callback.bind(options.context), arguments);
      };
    });
  }

  var status;
  if (options.data) {
    status = binding.renderSync(options);
  } else if (options.file) {
    status = binding.renderFileSync(options);
  } else {
    throw new Error('No input specified: provide a file name or a source string to process');
  }

  var result = options.result;

  if (status) {
    result.stats = endStats(result.stats);
    return result;
  }

  throw assign(new Error(), JSON.parse(result.error));
};

/**
 * API Info
 *
 * @api public
 */

module.exports.info = sass.getVersionInfo(binding);

/**
 * Expose sass types
 */

module.exports.types = binding.types;
module.exports.TRUE = binding.types.Boolean.TRUE;
module.exports.FALSE = binding.types.Boolean.FALSE;
module.exports.NULL = binding.types.Null.NULL;

/**
 * Polyfill the old API
 *
 * TODO: remove for 4.0
 */

function processSassDeprecationMessage() {
  console.log('Deprecation warning: `process.sass` is an undocumented internal that will be removed in future versions of Node Sass.');
}

process.sass = process.sass || {
  get versionInfo()   { processSassDeprecationMessage(); return module.exports.info; },
  get binaryName()    { processSassDeprecationMessage(); return sass.getBinaryName(); },
  get binaryUrl()     { processSassDeprecationMessage(); return sass.getBinaryUrl(); },
  get binaryPath()    { processSassDeprecationMessage(); return sass.getBinaryPath(); },
  get getBinaryPath() { processSassDeprecationMessage(); return sass.getBinaryPath; },
};


/***/ }),

/***/ 1223:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wrappy = __webpack_require__(2940)
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}


/***/ }),

/***/ 8714:
/***/ ((module) => {

"use strict";


function posix(path) {
	return path.charAt(0) === '/';
}

function win32(path) {
	// https://github.com/nodejs/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
	var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
	var result = splitDeviceRe.exec(path);
	var device = result[1] || '';
	var isUnc = Boolean(device && device.charAt(1) !== ':');

	// UNC paths are always absolute
	return Boolean(result[2] || isUnc);
}

module.exports = process.platform === 'win32' ? win32 : posix;
module.exports.posix = posix;
module.exports.win32 = win32;


/***/ }),

/***/ 4033:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

class SassError extends Error {
  constructor(sassError, resourcePath) {
    super();
    this.name = 'SassError';
    this.originalSassError = sassError;
    this.loc = {
      line: sassError.line,
      column: sassError.column
    }; // Keep original error if `sassError.formatted` is unavailable

    this.message = `${this.name}: ${this.originalSassError.message}`;

    if (this.originalSassError.formatted) {
      this.message = `${this.name}: ${this.originalSassError.formatted.replace(/^Error: /, '').replace(/(\s*)stdin(\s*)/, `$1${resourcePath}$2`)}`; // Instruct webpack to hide the JS stack from the console.
      // Usually you're only interested in the SASS stack in this case.
      // eslint-disable-next-line no-param-reassign

      this.hideStack = true;
      Error.captureStackTrace(this, this.constructor);
    }
  }

}

var _default = SassError;
exports.default = _default;

/***/ }),

/***/ 1915:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const loader = __webpack_require__(6314);

module.exports = loader.default;

/***/ }),

/***/ 5052:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

function getDefaultSassImplementation() {
  let sassImplPkg = 'node-sass';

  try {
    __webpack_require__.ab + "index31.js"
  } catch (error) {
    try {
      require.resolve('sass');

      sassImplPkg = 'sass';
    } catch (ignoreError) {
      sassImplPkg = 'node-sass';
    }
  } // eslint-disable-next-line import/no-dynamic-require, global-require


  return __webpack_require__(8279);
}

var _default = getDefaultSassImplementation;
exports.default = _default;

/***/ }),

/***/ 886:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _neoAsync = _interopRequireDefault(__webpack_require__(117));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let nodeSassJobQueue = null;
/**
 * Verifies that the implementation and version of Sass is supported by this loader.
 *
 * @param {Object} implementation
 * @returns {Function}
 */

function getRenderFunctionFromSassImplementation(implementation) {
  const isDartSass = implementation.info.includes('dart-sass');

  if (isDartSass) {
    return implementation.render.bind(implementation);
  } // There is an issue with node-sass when async custom importers are used
  // See https://github.com/sass/node-sass/issues/857#issuecomment-93594360
  // We need to use a job queue to make sure that one thread is always available to the UV lib


  if (nodeSassJobQueue === null) {
    const threadPoolSize = Number(process.env.UV_THREADPOOL_SIZE || 4);
    nodeSassJobQueue = _neoAsync.default.queue(implementation.render.bind(implementation), threadPoolSize - 1);
  }

  return nodeSassJobQueue.push.bind(nodeSassJobQueue);
}

var _default = getRenderFunctionFromSassImplementation;
exports.default = _default;

/***/ }),

/***/ 3594:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _semver = _interopRequireDefault(__webpack_require__(5911));

var _getDefaultSassImplementation = _interopRequireDefault(__webpack_require__(5052));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getSassImplementation(implementation) {
  let resolvedImplementation = implementation;

  if (!resolvedImplementation) {
    // eslint-disable-next-line no-param-reassign
    resolvedImplementation = (0, _getDefaultSassImplementation.default)();
  }

  const {
    info
  } = resolvedImplementation;

  if (!info) {
    throw new Error('Unknown Sass implementation.');
  }

  const infoParts = info.split('\t');

  if (infoParts.length < 2) {
    throw new Error(`Unknown Sass implementation "${info}".`);
  }

  const [implementationName, version] = infoParts;

  if (implementationName === 'dart-sass') {
    if (!_semver.default.satisfies(version, '^1.3.0')) {
      throw new Error(`Dart Sass version ${version} is incompatible with ^1.3.0.`);
    }

    return resolvedImplementation;
  } else if (implementationName === 'node-sass') {
    if (!_semver.default.satisfies(version, '^4.0.0')) {
      throw new Error(`Node Sass version ${version} is incompatible with ^4.0.0.`);
    }

    return resolvedImplementation;
  }

  throw new Error(`Unknown Sass implementation "${implementationName}".`);
}

var _default = getSassImplementation;
exports.default = _default;

/***/ }),

/***/ 9816:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _os = _interopRequireDefault(__webpack_require__(2087));

var _path = _interopRequireDefault(__webpack_require__(5622));

var _cloneDeep = _interopRequireDefault(__webpack_require__(639));

var _proxyCustomImporters = _interopRequireDefault(__webpack_require__(8616));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isProductionLikeMode(loaderContext) {
  return loaderContext.mode === 'production' || !loaderContext.mode || loaderContext.minimize;
}
/**
 * Derives the sass options from the loader context and normalizes its values with sane defaults.
 *
 * @param {object} loaderContext
 * @param {object} loaderOptions
 * @param {string} content
 * @param {object} implementation
 * @returns {Object}
 */


function getSassOptions(loaderContext, loaderOptions, content, implementation) {
  const options = (0, _cloneDeep.default)(loaderOptions.sassOptions ? typeof loaderOptions.sassOptions === 'function' ? loaderOptions.sassOptions(loaderContext) || {} : loaderOptions.sassOptions : {});
  const isDartSass = implementation.info.includes('dart-sass');

  if (isDartSass) {
    const shouldTryToResolveFibers = !options.fiber && options.fiber !== false;

    if (shouldTryToResolveFibers) {
      let fibers;

      try {
        fibers = require.resolve('fibers');
      } catch (_error) {// Nothing
      }

      if (fibers) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        options.fiber = require(fibers);
      }
    } else if (options.fiber === false) {
      // Don't pass the `fiber` option for `sass` (`Dart Sass`)
      delete options.fiber;
    }
  } else {
    // Don't pass the `fiber` option for `node-sass`
    delete options.fiber;
  }

  options.data = loaderOptions.prependData ? typeof loaderOptions.prependData === 'function' ? loaderOptions.prependData(loaderContext) + _os.default.EOL + content : loaderOptions.prependData + _os.default.EOL + content : content; // opt.outputStyle

  if (!options.outputStyle && isProductionLikeMode(loaderContext)) {
    options.outputStyle = 'compressed';
  }

  const useSourceMap = typeof loaderOptions.sourceMap === 'boolean' ? loaderOptions.sourceMap : loaderContext.sourceMap; // opt.sourceMap
  // Not using the `this.sourceMap` flag because css source maps are different
  // @see https://github.com/webpack/css-loader/pull/40

  if (useSourceMap) {
    // Deliberately overriding the sourceMap option here.
    // node-sass won't produce source maps if the data option is used and options.sourceMap is not a string.
    // In case it is a string, options.sourceMap should be a path where the source map is written.
    // But since we're using the data option, the source map will not actually be written, but
    // all paths in sourceMap.sources will be relative to that path.
    // Pretty complicated... :(
    options.sourceMap = _path.default.join(process.cwd(), '/sass.map');

    if ('sourceMapRoot' in options === false) {
      options.sourceMapRoot = process.cwd();
    }

    if ('omitSourceMapUrl' in options === false) {
      // The source map url doesn't make sense because we don't know the output path
      // The css-loader will handle that for us
      options.omitSourceMapUrl = true;
    }

    if ('sourceMapContents' in options === false) {
      // If sourceMapContents option is not set, set it to true otherwise maps will be empty/null
      // when exported by webpack-extract-text-plugin.
      options.sourceMapContents = true;
    }
  }

  const {
    resourcePath
  } = loaderContext;

  const ext = _path.default.extname(resourcePath); // If we are compiling sass and indentedSyntax isn't set, automatically set it.


  if (ext && ext.toLowerCase() === '.sass' && 'indentedSyntax' in options === false) {
    options.indentedSyntax = true;
  } else {
    options.indentedSyntax = Boolean(options.indentedSyntax);
  } // Allow passing custom importers to `node-sass`. Accepts `Function` or an array of `Function`s.


  options.importer = options.importer ? (0, _proxyCustomImporters.default)(options.importer, resourcePath) : [];
  options.includePaths = (options.includePaths || []).concat(_path.default.dirname(resourcePath));
  return options;
}

var _default = getSassOptions;
exports.default = _default;

/***/ }),

/***/ 6720:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _path = _interopRequireDefault(__webpack_require__(5622));

var _loaderUtils = _interopRequireDefault(__webpack_require__(3432));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Examples:
// - ~package
// - ~package/
// - ~@org
// - ~@org/
// - ~@org/package
// - ~@org/package/
const matchModuleImport = /^~([^/]+|[^/]+\/|@[^/]+[/][^/]+|@[^/]+\/?|@[^/]+[/][^/]+\/)$/;
/**
 * When libsass tries to resolve an import, it uses a special algorithm.
 * Since the sass-loader uses webpack to resolve the modules, we need to simulate that algorithm. This function
 * returns an array of import paths to try. The last entry in the array is always the original url
 * to enable straight-forward webpack.config aliases.
 *
 * @param {string} url
 * @returns {Array<string>}
 */

function importsToResolve(url) {
  const request = _loaderUtils.default.urlToRequest(url); // Keep in mind: ext can also be something like '.datepicker' when the true extension is omitted and the filename contains a dot.
  // @see https://github.com/webpack-contrib/sass-loader/issues/167


  const ext = _path.default.extname(request).toLowerCase(); // In case there is module request, send this to webpack resolver


  if (matchModuleImport.test(url)) {
    return [request, url];
  } // Because @import is also defined in CSS, Sass needs a way of compiling plain CSS @imports without trying to import the files at compile time.
  // To accomplish this, and to ensure SCSS is as much of a superset of CSS as possible, Sass will compile any @imports with the following characteristics to plain CSS imports:
  //  - imports where the URL ends with .css.
  //  - imports where the URL begins http:// or https://.
  //  - imports where the URL is written as a url().
  //  - imports that have media queries.
  //
  // The `node-sass` package sends `@import` ending on `.css` to importer, it is bug, so we skip resolve


  if (ext === '.css') {
    return [];
  }

  const dirname = _path.default.dirname(request);

  const basename = _path.default.basename(request); // In case there is file extension:
  //
  // 1. Try to resolve `_` file.
  // 2. Try to resolve file without `_`.
  // 3. Send a original url to webpack resolver, maybe it is alias.


  if (['.scss', '.sass'].includes(ext)) {
    return [`${dirname}/_${basename}`, `${dirname}/${basename}`, url];
  } // In case there is no file extension and filename starts with `_`:
  //
  // 1. Try to resolve files with `scss`, `sass` and `css` extensions.
  // 2. Try to resolve directory with `_index` or `index` filename.
  // 3. Send the original url to webpack resolver, maybe it's alias.


  if (basename.startsWith('_')) {
    return [`${request}.scss`, `${request}.sass`, `${request}.css`, request, url];
  } // In case there is no file extension and filename doesn't start with `_`:
  //
  // 1. Try to resolve file starts with `_` and with extensions
  // 2. Try to resolve file with extensions
  // 3. Try to resolve directory with `_index` or `index` filename.
  // 4. Send a original url to webpack resolver, maybe it is alias.


  return [`${dirname}/_${basename}.scss`, `${dirname}/_${basename}.sass`, `${dirname}/_${basename}.css`, `${request}.scss`, `${request}.sass`, `${request}.css`, request, url];
}

var _default = importsToResolve;
exports.default = _default;

/***/ }),

/***/ 6314:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _path = _interopRequireDefault(__webpack_require__(5622));

var _schemaUtils = _interopRequireDefault(__webpack_require__(5799));

var _loaderUtils = __webpack_require__(3432);

var _options = _interopRequireDefault(__webpack_require__(4987));

var _getSassImplementation = _interopRequireDefault(__webpack_require__(3594));

var _getSassOptions = _interopRequireDefault(__webpack_require__(9816));

var _webpackImporter = _interopRequireDefault(__webpack_require__(6806));

var _getRenderFunctionFromSassImplementation = _interopRequireDefault(__webpack_require__(886));

var _SassError = _interopRequireDefault(__webpack_require__(4033));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The sass-loader makes node-sass and dart-sass available to webpack modules.
 *
 * @this {object}
 * @param {string} content
 */
function loader(content) {
  const options = (0, _loaderUtils.getOptions)(this) || {};
  (0, _schemaUtils.default)(_options.default, options, {
    name: 'Sass Loader',
    baseDataPath: 'options'
  });
  const implementation = (0, _getSassImplementation.default)(options.implementation);
  const callback = this.async();

  const addNormalizedDependency = file => {
    // node-sass returns POSIX paths
    this.addDependency(_path.default.normalize(file));
  };

  const sassOptions = (0, _getSassOptions.default)(this, options, content, implementation);
  const shouldUseWebpackImporter = typeof options.webpackImporter === 'boolean' ? options.webpackImporter : true;

  if (shouldUseWebpackImporter) {
    const resolve = this.getResolve({
      mainFields: ['sass', 'style', 'main', '...'],
      mainFiles: ['_index', 'index', '...'],
      extensions: ['.scss', '.sass', '.css', '...']
    });
    sassOptions.importer.push((0, _webpackImporter.default)(this.resourcePath, resolve, addNormalizedDependency));
  } // Skip empty files, otherwise it will stop webpack, see issue #21


  if (sassOptions.data.trim() === '') {
    callback(null, '');
    return;
  }

  const render = (0, _getRenderFunctionFromSassImplementation.default)(implementation);
  render(sassOptions, (error, result) => {
    if (error) {
      if (error.file) {
        addNormalizedDependency(error.file);
      }

      callback(new _SassError.default(error, this.resourcePath));
      return;
    }

    if (result.map && result.map !== '{}') {
      // eslint-disable-next-line no-param-reassign
      result.map = JSON.parse(result.map); // result.map.file is an optional property that provides the output filename.
      // Since we don't know the final filename in the webpack build chain yet, it makes no sense to have it.
      // eslint-disable-next-line no-param-reassign

      delete result.map.file; // One of the sources is 'stdin' according to dart-sass/node-sass because we've used the data input.
      // Now let's override that value with the correct relative path.
      // Since we specified options.sourceMap = path.join(process.cwd(), "/sass.map"); in getSassOptions,
      // we know that this path is relative to process.cwd(). This is how node-sass works.
      // eslint-disable-next-line no-param-reassign

      const stdinIndex = result.map.sources.findIndex(source => source.includes('stdin'));

      if (stdinIndex !== -1) {
        // eslint-disable-next-line no-param-reassign
        result.map.sources[stdinIndex] = _path.default.relative(process.cwd(), this.resourcePath);
      } // node-sass returns POSIX paths, that's why we need to transform them back to native paths.
      // This fixes an error on windows where the source-map module cannot resolve the source maps.
      // @see https://github.com/webpack-contrib/sass-loader/issues/366#issuecomment-279460722
      // eslint-disable-next-line no-param-reassign


      result.map.sourceRoot = _path.default.normalize(result.map.sourceRoot); // eslint-disable-next-line no-param-reassign

      result.map.sources = result.map.sources.map(_path.default.normalize);
    } else {
      // eslint-disable-next-line no-param-reassign
      result.map = null;
    }

    result.stats.includedFiles.forEach(addNormalizedDependency);
    callback(null, result.css.toString(), result.map);
  });
}

var _default = loader;
exports.default = _default;

/***/ }),

/***/ 8616:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

/**
 * Creates new custom importers that use the given `resourcePath` if libsass calls the custom importer with `prev`
 * being 'stdin'.
 *
 * Why do we need this? We have to use the `data` option of node-sass in order to compile our sass because
 * the `resourcePath` might not be an actual file on disk. When using the `data` option, libsass uses the string
 * 'stdin' instead of a filename.
 *
 * We have to fix this behavior in order to provide a consistent experience to the webpack user.
 *
 * @param {Function|Array<Function>} importer
 * @param {string} resourcePath
 * @returns {Array<Function>}
 */
function proxyCustomImporters(importer, resourcePath) {
  return [].concat(importer).map( // eslint-disable-next-line no-shadow
  importer => function customImporter() {
    return importer.apply(this, // eslint-disable-next-line prefer-rest-params
    Array.from(arguments).map((arg, i) => i === 1 && arg === 'stdin' ? resourcePath : arg));
  });
}

var _default = proxyCustomImporters;
exports.default = _default;

/***/ }),

/***/ 6806:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _path = _interopRequireDefault(__webpack_require__(5622));

var _importsToResolve = _interopRequireDefault(__webpack_require__(6720));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @name PromisedResolve
 * @type {Function}
 * @param {string} dir
 * @param {string} request
 * @returns Promise
 */

/**
 * @name Importer
 * @type {Function}
 * @param {string} url
 * @param {string} prev
 * @param {Function<Error, string>} done
 */
const matchCss = /\.css$/i;
/**
 * Returns an importer that uses webpack's resolving algorithm.
 *
 * It's important that the returned function has the correct number of arguments
 * (based on whether the call is sync or async) because otherwise node-sass doesn't exit.
 *
 * @param {string} resourcePath
 * @param {PromisedResolve} resolve
 * @param {Function<string>} addNormalizedDependency
 * @returns {Importer}
 */

function webpackImporter(resourcePath, resolve, addNormalizedDependency) {
  function dirContextFrom(fileContext) {
    return _path.default.dirname( // The first file is 'stdin' when we're using the data option
    fileContext === 'stdin' ? resourcePath : fileContext);
  } // eslint-disable-next-line no-shadow


  function startResolving(dir, importsToResolve) {
    return importsToResolve.length === 0 ? Promise.reject() : resolve(dir, importsToResolve[0]).then(resolvedFile => {
      // Add the resolvedFilename as dependency. Although we're also using stats.includedFiles, this might come
      // in handy when an error occurs. In this case, we don't get stats.includedFiles from node-sass.
      addNormalizedDependency(resolvedFile);
      return {
        // By removing the CSS file extension, we trigger node-sass to include the CSS file instead of just linking it.
        file: resolvedFile.replace(matchCss, '')
      };
    }, () => {
      const [, ...tailResult] = importsToResolve;
      return startResolving(dir, tailResult);
    });
  }

  return (url, prev, done) => {
    startResolving(dirContextFrom(prev), (0, _importsToResolve.default)(url)) // Catch all resolving errors, return the original file and pass responsibility back to other custom importers
    .catch(() => {
      return {
        file: url
      };
    }).then(done);
  };
}

var _default = webpackImporter;
exports.default = _default;

/***/ }),

/***/ 5064:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

const {
  stringHints,
  numberHints
} = __webpack_require__(1486);
/** @typedef {import("json-schema").JSONSchema6} JSONSchema6 */

/** @typedef {import("json-schema").JSONSchema7} JSONSchema7 */

/** @typedef {import("./validate").Schema} Schema */

/** @typedef {import("./validate").ValidationErrorConfiguration} ValidationErrorConfiguration */

/** @typedef {import("./validate").PostFormatter} PostFormatter */

/** @typedef {import("./validate").SchemaUtilErrorObject} SchemaUtilErrorObject */

/** @enum {number} */


const SPECIFICITY = {
  type: 1,
  not: 1,
  oneOf: 1,
  anyOf: 1,
  if: 1,
  enum: 1,
  const: 1,
  instanceof: 1,
  required: 2,
  pattern: 2,
  patternRequired: 2,
  format: 2,
  formatMinimum: 2,
  formatMaximum: 2,
  minimum: 2,
  exclusiveMinimum: 2,
  maximum: 2,
  exclusiveMaximum: 2,
  multipleOf: 2,
  uniqueItems: 2,
  contains: 2,
  minLength: 2,
  maxLength: 2,
  minItems: 2,
  maxItems: 2,
  minProperties: 2,
  maxProperties: 2,
  dependencies: 2,
  propertyNames: 2,
  additionalItems: 2,
  additionalProperties: 2,
  absolutePath: 2
};
/**
 *
 * @param {Array<SchemaUtilErrorObject>} array
 * @param {(item: SchemaUtilErrorObject) => number} fn
 * @returns {Array<SchemaUtilErrorObject>}
 */

function filterMax(array, fn) {
  const evaluatedMax = array.reduce((max, item) => Math.max(max, fn(item)), 0);
  return array.filter(item => fn(item) === evaluatedMax);
}
/**
 *
 * @param {Array<SchemaUtilErrorObject>} children
 * @returns {Array<SchemaUtilErrorObject>}
 */


function filterChildren(children) {
  let newChildren = children;
  newChildren = filterMax(newChildren,
  /**
   *
   * @param {SchemaUtilErrorObject} error
   * @returns {number}
   */
  error => error.dataPath ? error.dataPath.length : 0);
  newChildren = filterMax(newChildren,
  /**
   * @param {SchemaUtilErrorObject} error
   * @returns {number}
   */
  error => SPECIFICITY[
  /** @type {keyof typeof SPECIFICITY} */
  error.keyword] || 2);
  return newChildren;
}
/**
 * Find all children errors
 * @param {Array<SchemaUtilErrorObject>} children
 * @param {Array<string>} schemaPaths
 * @return {number} returns index of first child
 */


function findAllChildren(children, schemaPaths) {
  let i = children.length - 1;

  const predicate =
  /**
   * @param {string} schemaPath
   * @returns {boolean}
   */
  schemaPath => children[i].schemaPath.indexOf(schemaPath) !== 0;

  while (i > -1 && !schemaPaths.every(predicate)) {
    if (children[i].keyword === 'anyOf' || children[i].keyword === 'oneOf') {
      const refs = extractRefs(children[i]);
      const childrenStart = findAllChildren(children.slice(0, i), refs.concat(children[i].schemaPath));
      i = childrenStart - 1;
    } else {
      i -= 1;
    }
  }

  return i + 1;
}
/**
 * Extracts all refs from schema
 * @param {SchemaUtilErrorObject} error
 * @return {Array<string>}
 */


function extractRefs(error) {
  const {
    schema
  } = error;

  if (!Array.isArray(schema)) {
    return [];
  }

  return schema.map(({
    $ref
  }) => $ref).filter(s => s);
}
/**
 * Groups children by their first level parent (assuming that error is root)
 * @param {Array<SchemaUtilErrorObject>} children
 * @return {Array<SchemaUtilErrorObject>}
 */


function groupChildrenByFirstChild(children) {
  const result = [];
  let i = children.length - 1;

  while (i > 0) {
    const child = children[i];

    if (child.keyword === 'anyOf' || child.keyword === 'oneOf') {
      const refs = extractRefs(child);
      const childrenStart = findAllChildren(children.slice(0, i), refs.concat(child.schemaPath));

      if (childrenStart !== i) {
        result.push(Object.assign({}, child, {
          children: children.slice(childrenStart, i)
        }));
        i = childrenStart;
      } else {
        result.push(child);
      }
    } else {
      result.push(child);
    }

    i -= 1;
  }

  if (i === 0) {
    result.push(children[i]);
  }

  return result.reverse();
}
/**
 * @param {string} str
 * @param {string} prefix
 * @returns {string}
 */


function indent(str, prefix) {
  return str.replace(/\n(?!$)/g, `\n${prefix}`);
}
/**
 * @param {Schema} schema
 * @returns {schema is (Schema & {not: Schema})}
 */


function hasNotInSchema(schema) {
  return !!schema.not;
}
/**
 * @param {Schema} schema
 * @return {Schema}
 */


function findFirstTypedSchema(schema) {
  if (hasNotInSchema(schema)) {
    return findFirstTypedSchema(schema.not);
  }

  return schema;
}
/**
 * @param {Schema} schema
 * @return {boolean}
 */


function canApplyNot(schema) {
  const typedSchema = findFirstTypedSchema(schema);
  return likeNumber(typedSchema) || likeInteger(typedSchema) || likeString(typedSchema) || likeNull(typedSchema) || likeBoolean(typedSchema);
}
/**
 * @param {any} maybeObj
 * @returns {boolean}
 */


function isObject(maybeObj) {
  return typeof maybeObj === 'object' && maybeObj !== null;
}
/**
 * @param {Schema} schema
 * @returns {boolean}
 */


function likeNumber(schema) {
  return schema.type === 'number' || typeof schema.minimum !== 'undefined' || typeof schema.exclusiveMinimum !== 'undefined' || typeof schema.maximum !== 'undefined' || typeof schema.exclusiveMaximum !== 'undefined' || typeof schema.multipleOf !== 'undefined';
}
/**
 * @param {Schema} schema
 * @returns {boolean}
 */


function likeInteger(schema) {
  return schema.type === 'integer' || typeof schema.minimum !== 'undefined' || typeof schema.exclusiveMinimum !== 'undefined' || typeof schema.maximum !== 'undefined' || typeof schema.exclusiveMaximum !== 'undefined' || typeof schema.multipleOf !== 'undefined';
}
/**
 * @param {Schema} schema
 * @returns {boolean}
 */


function likeString(schema) {
  return schema.type === 'string' || typeof schema.minLength !== 'undefined' || typeof schema.maxLength !== 'undefined' || typeof schema.pattern !== 'undefined' || typeof schema.format !== 'undefined' || typeof schema.formatMinimum !== 'undefined' || typeof schema.formatMaximum !== 'undefined';
}
/**
 * @param {Schema} schema
 * @returns {boolean}
 */


function likeBoolean(schema) {
  return schema.type === 'boolean';
}
/**
 * @param {Schema} schema
 * @returns {boolean}
 */


function likeArray(schema) {
  return schema.type === 'array' || typeof schema.minItems === 'number' || typeof schema.maxItems === 'number' || typeof schema.uniqueItems !== 'undefined' || typeof schema.items !== 'undefined' || typeof schema.additionalItems !== 'undefined' || typeof schema.contains !== 'undefined';
}
/**
 * @param {Schema & {patternRequired?: Array<string>}} schema
 * @returns {boolean}
 */


function likeObject(schema) {
  return schema.type === 'object' || typeof schema.minProperties !== 'undefined' || typeof schema.maxProperties !== 'undefined' || typeof schema.required !== 'undefined' || typeof schema.properties !== 'undefined' || typeof schema.patternProperties !== 'undefined' || typeof schema.additionalProperties !== 'undefined' || typeof schema.dependencies !== 'undefined' || typeof schema.propertyNames !== 'undefined' || typeof schema.patternRequired !== 'undefined';
}
/**
 * @param {Schema} schema
 * @returns {boolean}
 */


function likeNull(schema) {
  return schema.type === 'null';
}
/**
 * @param {string} type
 * @returns {string}
 */


function getArticle(type) {
  if (/^[aeiou]/i.test(type)) {
    return 'an';
  }

  return 'a';
}
/**
 * @param {Schema=} schema
 * @returns {string}
 */


function getSchemaNonTypes(schema) {
  if (!schema) {
    return '';
  }

  if (!schema.type) {
    if (likeNumber(schema) || likeInteger(schema)) {
      return ' | should be any non-number';
    }

    if (likeString(schema)) {
      return ' | should be any non-string';
    }

    if (likeArray(schema)) {
      return ' | should be any non-array';
    }

    if (likeObject(schema)) {
      return ' | should be any non-object';
    }
  }

  return '';
}
/**
 * @param {Array<string>} hints
 * @returns {string}
 */


function formatHints(hints) {
  return hints.length > 0 ? `(${hints.join(', ')})` : '';
}
/**
 * @param {Schema} schema
 * @param {boolean} logic
 * @returns {string[]}
 */


function getHints(schema, logic) {
  if (likeNumber(schema) || likeInteger(schema)) {
    return numberHints(schema, logic);
  } else if (likeString(schema)) {
    return stringHints(schema, logic);
  }

  return [];
}

class ValidationError extends Error {
  /**
   * @param {Array<SchemaUtilErrorObject>} errors
   * @param {Schema} schema
   * @param {ValidationErrorConfiguration} configuration
   */
  constructor(errors, schema, configuration = {}) {
    super();
    /** @type {string} */

    this.name = 'ValidationError';
    /** @type {Array<SchemaUtilErrorObject>} */

    this.errors = errors;
    /** @type {Schema} */

    this.schema = schema;
    let headerNameFromSchema;
    let baseDataPathFromSchema;

    if (schema.title && (!configuration.name || !configuration.baseDataPath)) {
      const splittedTitleFromSchema = schema.title.match(/^(.+) (.+)$/);

      if (splittedTitleFromSchema) {
        if (!configuration.name) {
          [, headerNameFromSchema] = splittedTitleFromSchema;
        }

        if (!configuration.baseDataPath) {
          [,, baseDataPathFromSchema] = splittedTitleFromSchema;
        }
      }
    }
    /** @type {string} */


    this.headerName = configuration.name || headerNameFromSchema || 'Object';
    /** @type {string} */

    this.baseDataPath = configuration.baseDataPath || baseDataPathFromSchema || 'configuration';
    /** @type {PostFormatter | null} */

    this.postFormatter = configuration.postFormatter || null;
    const header = `Invalid ${this.baseDataPath} object. ${this.headerName} has been initialized using ${getArticle(this.baseDataPath)} ${this.baseDataPath} object that does not match the API schema.\n`;
    /** @type {string} */

    this.message = `${header}${this.formatValidationErrors(errors)}`;
    Error.captureStackTrace(this, this.constructor);
  }
  /**
   * @param {string} path
   * @returns {Schema}
   */


  getSchemaPart(path) {
    const newPath = path.split('/');
    let schemaPart = this.schema;

    for (let i = 1; i < newPath.length; i++) {
      const inner = schemaPart[
      /** @type {keyof Schema} */
      newPath[i]];

      if (!inner) {
        break;
      }

      schemaPart = inner;
    }

    return schemaPart;
  }
  /**
   * @param {Schema} schema
   * @param {boolean} logic
   * @param {Array<Object>} prevSchemas
   * @returns {string}
   */


  formatSchema(schema, logic = true, prevSchemas = []) {
    let newLogic = logic;

    const formatInnerSchema =
    /**
     *
     * @param {Object} innerSchema
     * @param {boolean=} addSelf
     * @returns {string}
     */
    (innerSchema, addSelf) => {
      if (!addSelf) {
        return this.formatSchema(innerSchema, newLogic, prevSchemas);
      }

      if (prevSchemas.includes(innerSchema)) {
        return '(recursive)';
      }

      return this.formatSchema(innerSchema, newLogic, prevSchemas.concat(schema));
    };

    if (hasNotInSchema(schema) && !likeObject(schema)) {
      if (canApplyNot(schema.not)) {
        newLogic = !logic;
        return formatInnerSchema(schema.not);
      }

      const needApplyLogicHere = !schema.not.not;
      const prefix = logic ? '' : 'non ';
      newLogic = !logic;
      return needApplyLogicHere ? prefix + formatInnerSchema(schema.not) : formatInnerSchema(schema.not);
    }

    if (
    /** @type {Schema & {instanceof: string | Array<string>}} */
    schema.instanceof) {
      const {
        instanceof: value
      } =
      /** @type {Schema & {instanceof: string | Array<string>}} */
      schema;
      const values = !Array.isArray(value) ? [value] : value;
      return values.map(
      /**
       * @param {string} item
       * @returns {string}
       */
      item => item === 'Function' ? 'function' : item).join(' | ');
    }

    if (schema.enum) {
      return (
        /** @type {Array<any>} */
        schema.enum.map(item => JSON.stringify(item)).join(' | ')
      );
    }

    if (typeof schema.const !== 'undefined') {
      return JSON.stringify(schema.const);
    }

    if (schema.oneOf) {
      return (
        /** @type {Array<Schema>} */
        schema.oneOf.map(item => formatInnerSchema(item, true)).join(' | ')
      );
    }

    if (schema.anyOf) {
      return (
        /** @type {Array<Schema>} */
        schema.anyOf.map(item => formatInnerSchema(item, true)).join(' | ')
      );
    }

    if (schema.allOf) {
      return (
        /** @type {Array<Schema>} */
        schema.allOf.map(item => formatInnerSchema(item, true)).join(' & ')
      );
    }

    if (
    /** @type {JSONSchema7} */
    schema.if) {
      const {
        if: ifValue,
        then: thenValue,
        else: elseValue
      } =
      /** @type {JSONSchema7} */
      schema;
      return `${ifValue ? `if ${formatInnerSchema(ifValue)}` : ''}${thenValue ? ` then ${formatInnerSchema(thenValue)}` : ''}${elseValue ? ` else ${formatInnerSchema(elseValue)}` : ''}`;
    }

    if (schema.$ref) {
      return formatInnerSchema(this.getSchemaPart(schema.$ref), true);
    }

    if (likeNumber(schema) || likeInteger(schema)) {
      const [type, ...hints] = getHints(schema, logic);
      const str = `${type}${hints.length > 0 ? ` ${formatHints(hints)}` : ''}`;
      return logic ? str : hints.length > 0 ? `non-${type} | ${str}` : `non-${type}`;
    }

    if (likeString(schema)) {
      const [type, ...hints] = getHints(schema, logic);
      const str = `${type}${hints.length > 0 ? ` ${formatHints(hints)}` : ''}`;
      return logic ? str : str === 'string' ? 'non-string' : `non-string | ${str}`;
    }

    if (likeBoolean(schema)) {
      return `${logic ? '' : 'non-'}boolean`;
    }

    if (likeArray(schema)) {
      // not logic already applied in formatValidationError
      newLogic = true;
      const hints = [];

      if (typeof schema.minItems === 'number') {
        hints.push(`should not have fewer than ${schema.minItems} item${schema.minItems > 1 ? 's' : ''}`);
      }

      if (typeof schema.maxItems === 'number') {
        hints.push(`should not have more than ${schema.maxItems} item${schema.maxItems > 1 ? 's' : ''}`);
      }

      if (schema.uniqueItems) {
        hints.push('should not have duplicate items');
      }

      const hasAdditionalItems = typeof schema.additionalItems === 'undefined' || Boolean(schema.additionalItems);
      let items = '';

      if (schema.items) {
        if (Array.isArray(schema.items) && schema.items.length > 0) {
          items = `${
          /** @type {Array<Schema>} */
          schema.items.map(item => formatInnerSchema(item)).join(', ')}`;

          if (hasAdditionalItems) {
            if (schema.additionalItems && isObject(schema.additionalItems) && Object.keys(schema.additionalItems).length > 0) {
              hints.push(`additional items should be ${formatInnerSchema(schema.additionalItems)}`);
            }
          }
        } else if (schema.items && Object.keys(schema.items).length > 0) {
          // "additionalItems" is ignored
          items = `${formatInnerSchema(schema.items)}`;
        } else {
          // Fallback for empty `items` value
          items = 'any';
        }
      } else {
        // "additionalItems" is ignored
        items = 'any';
      }

      if (schema.contains && Object.keys(schema.contains).length > 0) {
        hints.push(`should contains at least one ${this.formatSchema(schema.contains)} item`);
      }

      return `[${items}${hasAdditionalItems ? ', ...' : ''}]${hints.length > 0 ? ` (${hints.join(', ')})` : ''}`;
    }

    if (likeObject(schema)) {
      // not logic already applied in formatValidationError
      newLogic = true;
      const hints = [];

      if (typeof schema.minProperties === 'number') {
        hints.push(`should not have fewer than ${schema.minProperties} ${schema.minProperties > 1 ? 'properties' : 'property'}`);
      }

      if (typeof schema.maxProperties === 'number') {
        hints.push(`should not have more than ${schema.maxProperties} ${schema.minProperties && schema.minProperties > 1 ? 'properties' : 'property'}`);
      }

      if (schema.patternProperties && Object.keys(schema.patternProperties).length > 0) {
        const patternProperties = Object.keys(schema.patternProperties);
        hints.push(`additional property names should match pattern${patternProperties.length > 1 ? 's' : ''} ${patternProperties.map(pattern => JSON.stringify(pattern)).join(' | ')}`);
      }

      const properties = schema.properties ? Object.keys(schema.properties) : [];
      const required = schema.required ? schema.required : [];
      const allProperties = [...new Set(
      /** @type {Array<string>} */
      [].concat(required).concat(properties))];
      const objectStructure = allProperties.map(property => {
        const isRequired = required.includes(property); // Some properties need quotes, maybe we should add check
        // Maybe we should output type of property (`foo: string`), but it is looks very unreadable

        return `${property}${isRequired ? '' : '?'}`;
      }).concat(typeof schema.additionalProperties === 'undefined' || Boolean(schema.additionalProperties) ? schema.additionalProperties && isObject(schema.additionalProperties) ? [`<key>: ${formatInnerSchema(schema.additionalProperties)}`] : ['…'] : []).join(', ');
      const {
        dependencies,
        propertyNames,
        patternRequired
      } =
      /** @type {Schema & {patternRequired?: Array<string>;}} */
      schema;

      if (dependencies) {
        Object.keys(dependencies).forEach(dependencyName => {
          const dependency = dependencies[dependencyName];

          if (Array.isArray(dependency)) {
            hints.push(`should have ${dependency.length > 1 ? 'properties' : 'property'} ${dependency.map(dep => `'${dep}'`).join(', ')} when property '${dependencyName}' is present`);
          } else {
            hints.push(`should be valid according to the schema ${formatInnerSchema(dependency)} when property '${dependencyName}' is present`);
          }
        });
      }

      if (propertyNames && Object.keys(propertyNames).length > 0) {
        hints.push(`each property name should match format ${JSON.stringify(schema.propertyNames.format)}`);
      }

      if (patternRequired && patternRequired.length > 0) {
        hints.push(`should have property matching pattern ${patternRequired.map(
        /**
         * @param {string} item
         * @returns {string}
         */
        item => JSON.stringify(item))}`);
      }

      return `object {${objectStructure ? ` ${objectStructure} ` : ''}}${hints.length > 0 ? ` (${hints.join(', ')})` : ''}`;
    }

    if (likeNull(schema)) {
      return `${logic ? '' : 'non-'}null`;
    }

    if (Array.isArray(schema.type)) {
      // not logic already applied in formatValidationError
      return `${schema.type.join(' | ')}`;
    } // Fallback for unknown keywords
    // not logic already applied in formatValidationError

    /* istanbul ignore next */


    return JSON.stringify(schema, null, 2);
  }
  /**
   * @param {Schema=} schemaPart
   * @param {(boolean | Array<string>)=} additionalPath
   * @param {boolean=} needDot
   * @param {boolean=} logic
   * @returns {string}
   */


  getSchemaPartText(schemaPart, additionalPath, needDot = false, logic = true) {
    if (!schemaPart) {
      return '';
    }

    if (Array.isArray(additionalPath)) {
      for (let i = 0; i < additionalPath.length; i++) {
        /** @type {Schema | undefined} */
        const inner = schemaPart[
        /** @type {keyof Schema} */
        additionalPath[i]];

        if (inner) {
          // eslint-disable-next-line no-param-reassign
          schemaPart = inner;
        } else {
          break;
        }
      }
    }

    while (schemaPart.$ref) {
      // eslint-disable-next-line no-param-reassign
      schemaPart = this.getSchemaPart(schemaPart.$ref);
    }

    let schemaText = `${this.formatSchema(schemaPart, logic)}${needDot ? '.' : ''}`;

    if (schemaPart.description) {
      schemaText += `\n-> ${schemaPart.description}`;
    }

    return schemaText;
  }
  /**
   * @param {Schema=} schemaPart
   * @returns {string}
   */


  getSchemaPartDescription(schemaPart) {
    if (!schemaPart) {
      return '';
    }

    while (schemaPart.$ref) {
      // eslint-disable-next-line no-param-reassign
      schemaPart = this.getSchemaPart(schemaPart.$ref);
    }

    if (schemaPart.description) {
      return `\n-> ${schemaPart.description}`;
    }

    return '';
  }
  /**
   * @param {SchemaUtilErrorObject} error
   * @returns {string}
   */


  formatValidationError(error) {
    const {
      keyword,
      dataPath: errorDataPath
    } = error;
    const dataPath = `${this.baseDataPath}${errorDataPath}`;

    switch (keyword) {
      case 'type':
        {
          const {
            parentSchema,
            params
          } = error; // eslint-disable-next-line default-case

          switch (
          /** @type {import("ajv").TypeParams} */
          params.type) {
            case 'number':
              return `${dataPath} should be a ${this.getSchemaPartText(parentSchema, false, true)}`;

            case 'integer':
              return `${dataPath} should be a ${this.getSchemaPartText(parentSchema, false, true)}`;

            case 'string':
              return `${dataPath} should be a ${this.getSchemaPartText(parentSchema, false, true)}`;

            case 'boolean':
              return `${dataPath} should be a ${this.getSchemaPartText(parentSchema, false, true)}`;

            case 'array':
              return `${dataPath} should be an array:\n${this.getSchemaPartText(parentSchema)}`;

            case 'object':
              return `${dataPath} should be an object:\n${this.getSchemaPartText(parentSchema)}`;

            case 'null':
              return `${dataPath} should be a ${this.getSchemaPartText(parentSchema, false, true)}`;

            default:
              return `${dataPath} should be:\n${this.getSchemaPartText(parentSchema)}`;
          }
        }

      case 'instanceof':
        {
          const {
            parentSchema
          } = error;
          return `${dataPath} should be an instance of ${this.getSchemaPartText(parentSchema, false, true)}`;
        }

      case 'pattern':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            pattern
          } =
          /** @type {import("ajv").PatternParams} */
          params;
          return `${dataPath} should match pattern ${JSON.stringify(pattern)}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'format':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            format
          } =
          /** @type {import("ajv").FormatParams} */
          params;
          return `${dataPath} should match format ${JSON.stringify(format)}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'formatMinimum':
      case 'formatMaximum':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            comparison,
            limit
          } =
          /** @type {import("ajv").ComparisonParams} */
          params;
          return `${dataPath} should be ${comparison} ${JSON.stringify(limit)}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'minimum':
      case 'maximum':
      case 'exclusiveMinimum':
      case 'exclusiveMaximum':
        {
          const {
            parentSchema,
            params
          } = error;
          const {
            comparison,
            limit
          } =
          /** @type {import("ajv").ComparisonParams} */
          params;
          const [, ...hints] = getHints(
          /** @type {Schema} */
          parentSchema, true);

          if (hints.length === 0) {
            hints.push(`should be ${comparison} ${limit}`);
          }

          return `${dataPath} ${hints.join(' ')}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'multipleOf':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            multipleOf
          } =
          /** @type {import("ajv").MultipleOfParams} */
          params;
          return `${dataPath} should be multiple of ${multipleOf}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'patternRequired':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            missingPattern
          } =
          /** @type {import("ajv").PatternRequiredParams} */
          params;
          return `${dataPath} should have property matching pattern ${JSON.stringify(missingPattern)}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'minLength':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            limit
          } =
          /** @type {import("ajv").LimitParams} */
          params;

          if (limit === 1) {
            return `${dataPath} should be an non-empty string${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }

          const length = limit - 1;
          return `${dataPath} should be longer than ${length} character${length > 1 ? 's' : ''}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'minItems':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            limit
          } =
          /** @type {import("ajv").LimitParams} */
          params;

          if (limit === 1) {
            return `${dataPath} should be an non-empty array${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }

          return `${dataPath} should not have fewer than ${limit} items${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'minProperties':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            limit
          } =
          /** @type {import("ajv").LimitParams} */
          params;

          if (limit === 1) {
            return `${dataPath} should be an non-empty object${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }

          return `${dataPath} should not have fewer than ${limit} properties${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'maxLength':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            limit
          } =
          /** @type {import("ajv").LimitParams} */
          params;
          const max = limit + 1;
          return `${dataPath} should be shorter than ${max} character${max > 1 ? 's' : ''}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'maxItems':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            limit
          } =
          /** @type {import("ajv").LimitParams} */
          params;
          return `${dataPath} should not have more than ${limit} items${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'maxProperties':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            limit
          } =
          /** @type {import("ajv").LimitParams} */
          params;
          return `${dataPath} should not have more than ${limit} properties${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'uniqueItems':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            i
          } =
          /** @type {import("ajv").UniqueItemsParams} */
          params;
          return `${dataPath} should not contain the item '${error.data[i]}' twice${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'additionalItems':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            limit
          } =
          /** @type {import("ajv").LimitParams} */
          params;
          return `${dataPath} should not have more than ${limit} items${getSchemaNonTypes(parentSchema)}. These items are valid:\n${this.getSchemaPartText(parentSchema)}`;
        }

      case 'contains':
        {
          const {
            parentSchema
          } = error;
          return `${dataPath} should contains at least one ${this.getSchemaPartText(parentSchema, ['contains'])} item${getSchemaNonTypes(parentSchema)}.`;
        }

      case 'required':
        {
          const {
            parentSchema,
            params
          } = error;
          const missingProperty =
          /** @type {import("ajv").DependenciesParams} */
          params.missingProperty.replace(/^\./, '');
          const hasProperty = parentSchema && Boolean(
          /** @type {Schema} */
          parentSchema.properties &&
          /** @type {Schema} */
          parentSchema.properties[missingProperty]);
          return `${dataPath} misses the property '${missingProperty}'${getSchemaNonTypes(parentSchema)}.${hasProperty ? ` Should be:\n${this.getSchemaPartText(parentSchema, ['properties', missingProperty])}` : this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'additionalProperties':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            additionalProperty
          } =
          /** @type {import("ajv").AdditionalPropertiesParams} */
          params;
          return `${dataPath} has an unknown property '${additionalProperty}'${getSchemaNonTypes(parentSchema)}. These properties are valid:\n${this.getSchemaPartText(parentSchema)}`;
        }

      case 'dependencies':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            property,
            deps
          } =
          /** @type {import("ajv").DependenciesParams} */
          params;
          const dependencies = deps.split(',').map(
          /**
           * @param {string} dep
           * @returns {string}
           */
          dep => `'${dep.trim()}'`).join(', ');
          return `${dataPath} should have properties ${dependencies} when property '${property}' is present${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'propertyNames':
        {
          const {
            params,
            parentSchema,
            schema
          } = error;
          const {
            propertyName
          } =
          /** @type {import("ajv").PropertyNamesParams} */
          params;
          return `${dataPath} property name '${propertyName}' is invalid${getSchemaNonTypes(parentSchema)}. Property names should be match format ${JSON.stringify(schema.format)}.${this.getSchemaPartDescription(parentSchema)}`;
        }

      case 'enum':
        {
          const {
            parentSchema
          } = error;

          if (parentSchema &&
          /** @type {Schema} */
          parentSchema.enum &&
          /** @type {Schema} */
          parentSchema.enum.length === 1) {
            return `${dataPath} should be ${this.getSchemaPartText(parentSchema, false, true)}`;
          }

          return `${dataPath} should be one of these:\n${this.getSchemaPartText(parentSchema)}`;
        }

      case 'const':
        {
          const {
            parentSchema
          } = error;
          return `${dataPath} should be equal to constant ${this.getSchemaPartText(parentSchema, false, true)}`;
        }

      case 'not':
        {
          const postfix = likeObject(
          /** @type {Schema} */
          error.parentSchema) ? `\n${this.getSchemaPartText(error.parentSchema)}` : '';
          const schemaOutput = this.getSchemaPartText(error.schema, false, false, false);

          if (canApplyNot(error.schema)) {
            return `${dataPath} should be any ${schemaOutput}${postfix}.`;
          }

          const {
            schema,
            parentSchema
          } = error;
          return `${dataPath} should not be ${this.getSchemaPartText(schema, false, true)}${parentSchema && likeObject(parentSchema) ? `\n${this.getSchemaPartText(parentSchema)}` : ''}`;
        }

      case 'oneOf':
      case 'anyOf':
        {
          const {
            parentSchema,
            children
          } = error;

          if (children && children.length > 0) {
            if (error.schema.length === 1) {
              const lastChild = children[children.length - 1];
              const remainingChildren = children.slice(0, children.length - 1);
              return this.formatValidationError(Object.assign({}, lastChild, {
                children: remainingChildren,
                parentSchema: Object.assign({}, parentSchema, lastChild.parentSchema)
              }));
            }

            let filteredChildren = filterChildren(children);

            if (filteredChildren.length === 1) {
              return this.formatValidationError(filteredChildren[0]);
            }

            filteredChildren = groupChildrenByFirstChild(filteredChildren);
            return `${dataPath} should be one of these:\n${this.getSchemaPartText(parentSchema)}\nDetails:\n${filteredChildren.map(
            /**
             * @param {SchemaUtilErrorObject} nestedError
             * @returns {string}
             */
            nestedError => ` * ${indent(this.formatValidationError(nestedError), '   ')}`).join('\n')}`;
          }

          return `${dataPath} should be one of these:\n${this.getSchemaPartText(parentSchema)}`;
        }

      case 'if':
        {
          const {
            params,
            parentSchema
          } = error;
          const {
            failingKeyword
          } =
          /** @type {import("ajv").IfParams} */
          params;
          return `${dataPath} should match "${failingKeyword}" schema:\n${this.getSchemaPartText(parentSchema, [failingKeyword])}`;
        }

      case 'absolutePath':
        {
          const {
            message,
            parentSchema
          } = error;
          return `${dataPath}: ${message}${this.getSchemaPartDescription(parentSchema)}`;
        }

      /* istanbul ignore next */

      default:
        {
          const {
            message,
            parentSchema
          } = error;
          const ErrorInJSON = JSON.stringify(error, null, 2); // For `custom`, `false schema`, `$ref` keywords
          // Fallback for unknown keywords

          return `${dataPath} ${message} (${ErrorInJSON}).\n${this.getSchemaPartText(parentSchema, false)}`;
        }
    }
  }
  /**
   * @param {Array<SchemaUtilErrorObject>} errors
   * @returns {string}
   */


  formatValidationErrors(errors) {
    return errors.map(error => {
      let formattedError = this.formatValidationError(error);

      if (this.postFormatter) {
        formattedError = this.postFormatter(formattedError, error);
      }

      return ` - ${indent(formattedError, '   ')}`;
    }).join('\n');
  }

}

var _default = ValidationError;
exports.default = _default;

/***/ }),

/***/ 5799:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const validate = __webpack_require__(1255);

module.exports = validate.default;

/***/ }),

/***/ 6313:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

/** @typedef {import("ajv").Ajv} Ajv */

/** @typedef {import("ajv").ValidateFunction} ValidateFunction */

/** @typedef {import("../validate").SchemaUtilErrorObject} SchemaUtilErrorObject */

/**
 * @param {string} message
 * @param {object} schema
 * @param {string} data
 * @returns {SchemaUtilErrorObject}
 */
function errorMessage(message, schema, data) {
  return {
    // @ts-ignore
    // eslint-disable-next-line no-undefined
    dataPath: undefined,
    // @ts-ignore
    // eslint-disable-next-line no-undefined
    schemaPath: undefined,
    keyword: 'absolutePath',
    params: {
      absolutePath: data
    },
    message,
    parentSchema: schema
  };
}
/**
 * @param {boolean} shouldBeAbsolute
 * @param {object} schema
 * @param {string} data
 * @returns {SchemaUtilErrorObject}
 */


function getErrorFor(shouldBeAbsolute, schema, data) {
  const message = shouldBeAbsolute ? `The provided value ${JSON.stringify(data)} is not an absolute path!` : `A relative path is expected. However, the provided value ${JSON.stringify(data)} is an absolute path!`;
  return errorMessage(message, schema, data);
}
/**
 *
 * @param {Ajv} ajv
 * @returns {Ajv}
 */


function addAbsolutePathKeyword(ajv) {
  ajv.addKeyword('absolutePath', {
    errors: true,
    type: 'string',

    compile(schema, parentSchema) {
      /** @type {ValidateFunction} */
      const callback = data => {
        let passes = true;
        const isExclamationMarkPresent = data.includes('!');

        if (isExclamationMarkPresent) {
          callback.errors = [errorMessage(`The provided value ${JSON.stringify(data)} contains exclamation mark (!) which is not allowed because it's reserved for loader syntax.`, parentSchema, data)];
          passes = false;
        } // ?:[A-Za-z]:\\ - Windows absolute path
        // \\\\ - Windows network absolute path
        // \/ - Unix-like OS absolute path


        const isCorrectAbsolutePath = schema === /^(?:[A-Za-z]:(\\|\/)|\\\\|\/)/.test(data);

        if (!isCorrectAbsolutePath) {
          callback.errors = [getErrorFor(schema, parentSchema, data)];
          passes = false;
        }

        return passes;
      };

      callback.errors = [];
      return callback;
    }

  });
  return ajv;
}

var _default = addAbsolutePathKeyword;
exports.default = _default;

/***/ }),

/***/ 7021:
/***/ ((module) => {

"use strict";


/**
 * @typedef {[number, boolean]} RangeValue
 */

/**
 * @callback RangeValueCallback
 * @param {RangeValue} rangeValue
 * @returns {boolean}
 */
class Range {
  /**
   * @param {"left" | "right"} side
   * @param {boolean} exclusive
   * @returns {">" | ">=" | "<" | "<="}
   */
  static getOperator(side, exclusive) {
    if (side === 'left') {
      return exclusive ? '>' : '>=';
    }

    return exclusive ? '<' : '<=';
  }
  /**
   * @param {number} value
   * @param {boolean} logic is not logic applied
   * @param {boolean} exclusive is range exclusive
   * @returns {string}
   */


  static formatRight(value, logic, exclusive) {
    if (logic === false) {
      return Range.formatLeft(value, !logic, !exclusive);
    }

    return `should be ${Range.getOperator('right', exclusive)} ${value}`;
  }
  /**
   * @param {number} value
   * @param {boolean} logic is not logic applied
   * @param {boolean} exclusive is range exclusive
   * @returns {string}
   */


  static formatLeft(value, logic, exclusive) {
    if (logic === false) {
      return Range.formatRight(value, !logic, !exclusive);
    }

    return `should be ${Range.getOperator('left', exclusive)} ${value}`;
  }
  /**
   * @param {number} start left side value
   * @param {number} end right side value
   * @param {boolean} startExclusive is range exclusive from left side
   * @param {boolean} endExclusive is range exclusive from right side
   * @param {boolean} logic is not logic applied
   * @returns {string}
   */


  static formatRange(start, end, startExclusive, endExclusive, logic) {
    let result = 'should be';
    result += ` ${Range.getOperator(logic ? 'left' : 'right', logic ? startExclusive : !startExclusive)} ${start} `;
    result += logic ? 'and' : 'or';
    result += ` ${Range.getOperator(logic ? 'right' : 'left', logic ? endExclusive : !endExclusive)} ${end}`;
    return result;
  }
  /**
   * @param {Array<RangeValue>} values
   * @param {boolean} logic is not logic applied
   * @return {RangeValue} computed value and it's exclusive flag
   */


  static getRangeValue(values, logic) {
    let minMax = logic ? Infinity : -Infinity;
    let j = -1;
    const predicate = logic ?
    /** @type {RangeValueCallback} */
    ([value]) => value <= minMax :
    /** @type {RangeValueCallback} */
    ([value]) => value >= minMax;

    for (let i = 0; i < values.length; i++) {
      if (predicate(values[i])) {
        [minMax] = values[i];
        j = i;
      }
    }

    if (j > -1) {
      return values[j];
    }

    return [Infinity, true];
  }

  constructor() {
    /** @type {Array<RangeValue>} */
    this._left = [];
    /** @type {Array<RangeValue>} */

    this._right = [];
  }
  /**
   * @param {number} value
   * @param {boolean=} exclusive
   */


  left(value, exclusive = false) {
    this._left.push([value, exclusive]);
  }
  /**
   * @param {number} value
   * @param {boolean=} exclusive
   */


  right(value, exclusive = false) {
    this._right.push([value, exclusive]);
  }
  /**
   * @param {boolean} logic is not logic applied
   * @return {string} "smart" range string representation
   */


  format(logic = true) {
    const [start, leftExclusive] = Range.getRangeValue(this._left, logic);
    const [end, rightExclusive] = Range.getRangeValue(this._right, !logic);

    if (!Number.isFinite(start) && !Number.isFinite(end)) {
      return '';
    }

    const realStart = leftExclusive ? start + 1 : start;
    const realEnd = rightExclusive ? end - 1 : end; // e.g. 5 < x < 7, 5 < x <= 6, 6 <= x <= 6

    if (realStart === realEnd) {
      return `should be ${logic ? '' : '!'}= ${realStart}`;
    } // e.g. 4 < x < ∞


    if (Number.isFinite(start) && !Number.isFinite(end)) {
      return Range.formatLeft(start, logic, leftExclusive);
    } // e.g. ∞ < x < 4


    if (!Number.isFinite(start) && Number.isFinite(end)) {
      return Range.formatRight(end, logic, rightExclusive);
    }

    return Range.formatRange(start, end, leftExclusive, rightExclusive, logic);
  }

}

module.exports = Range;

/***/ }),

/***/ 1486:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const Range = __webpack_require__(7021);
/** @typedef {import("../validate").Schema} Schema */

/**
 * @param {Schema} schema
 * @param {boolean} logic
 * @return {string[]}
 */


module.exports.stringHints = function stringHints(schema, logic) {
  const hints = [];
  let type = 'string';
  const currentSchema = { ...schema
  };

  if (!logic) {
    const tmpLength = currentSchema.minLength;
    const tmpFormat = currentSchema.formatMinimum;
    const tmpExclusive = currentSchema.formatExclusiveMaximum;
    currentSchema.minLength = currentSchema.maxLength;
    currentSchema.maxLength = tmpLength;
    currentSchema.formatMinimum = currentSchema.formatMaximum;
    currentSchema.formatMaximum = tmpFormat;
    currentSchema.formatExclusiveMaximum = !currentSchema.formatExclusiveMinimum;
    currentSchema.formatExclusiveMinimum = !tmpExclusive;
  }

  if (typeof currentSchema.minLength === 'number') {
    if (currentSchema.minLength === 1) {
      type = 'non-empty string';
    } else {
      const length = Math.max(currentSchema.minLength - 1, 0);
      hints.push(`should be longer than ${length} character${length > 1 ? 's' : ''}`);
    }
  }

  if (typeof currentSchema.maxLength === 'number') {
    if (currentSchema.maxLength === 0) {
      type = 'empty string';
    } else {
      const length = currentSchema.maxLength + 1;
      hints.push(`should be shorter than ${length} character${length > 1 ? 's' : ''}`);
    }
  }

  if (currentSchema.pattern) {
    hints.push(`should${logic ? '' : ' not'} match pattern ${JSON.stringify(currentSchema.pattern)}`);
  }

  if (currentSchema.format) {
    hints.push(`should${logic ? '' : ' not'} match format ${JSON.stringify(currentSchema.format)}`);
  }

  if (currentSchema.formatMinimum) {
    hints.push(`should be ${currentSchema.formatExclusiveMinimum ? '>' : '>='} ${JSON.stringify(currentSchema.formatMinimum)}`);
  }

  if (currentSchema.formatMaximum) {
    hints.push(`should be ${currentSchema.formatExclusiveMaximum ? '<' : '<='} ${JSON.stringify(currentSchema.formatMaximum)}`);
  }

  return [type].concat(hints);
};
/**
 * @param {Schema} schema
 * @param {boolean} logic
 * @return {string[]}
 */


module.exports.numberHints = function numberHints(schema, logic) {
  const hints = [schema.type === 'integer' ? 'integer' : 'number'];
  const range = new Range();

  if (typeof schema.minimum === 'number') {
    range.left(schema.minimum);
  }

  if (typeof schema.exclusiveMinimum === 'number') {
    range.left(schema.exclusiveMinimum, true);
  }

  if (typeof schema.maximum === 'number') {
    range.right(schema.maximum);
  }

  if (typeof schema.exclusiveMaximum === 'number') {
    range.right(schema.exclusiveMaximum, true);
  }

  const rangeFormat = range.format(logic);

  if (rangeFormat) {
    hints.push(rangeFormat);
  }

  if (typeof schema.multipleOf === 'number') {
    hints.push(`should${logic ? '' : ' not'} be multiple of ${schema.multipleOf}`);
  }

  return hints;
};

/***/ }),

/***/ 1255:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _absolutePath = _interopRequireDefault(__webpack_require__(6313));

var _ValidationError = _interopRequireDefault(__webpack_require__(5064));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Use CommonJS require for ajv libs so TypeScript consumers aren't locked into esModuleInterop (see #110).
const Ajv = __webpack_require__(4941);

const ajvKeywords = __webpack_require__(35);
/** @typedef {import("json-schema").JSONSchema4} JSONSchema4 */

/** @typedef {import("json-schema").JSONSchema6} JSONSchema6 */

/** @typedef {import("json-schema").JSONSchema7} JSONSchema7 */

/** @typedef {import("ajv").ErrorObject} ErrorObject */

/**
 * @typedef {Object} Extend
 * @property {number=} formatMinimum
 * @property {number=} formatMaximum
 * @property {boolean=} formatExclusiveMinimum
 * @property {boolean=} formatExclusiveMaximum
 */

/** @typedef {(JSONSchema4 | JSONSchema6 | JSONSchema7) & Extend} Schema */

/** @typedef {ErrorObject & { children?: Array<ErrorObject>}} SchemaUtilErrorObject */

/**
 * @callback PostFormatter
 * @param {string} formattedError
 * @param {SchemaUtilErrorObject} error
 * @returns {string}
 */

/**
 * @typedef {Object} ValidationErrorConfiguration
 * @property {string=} name
 * @property {string=} baseDataPath
 * @property {PostFormatter=} postFormatter
 */


const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  $data: true
});
ajvKeywords(ajv, ['instanceof', 'formatMinimum', 'formatMaximum', 'patternRequired']); // Custom keywords

(0, _absolutePath.default)(ajv);
/**
 * @param {Schema} schema
 * @param {Array<object> | object} options
 * @param {ValidationErrorConfiguration=} configuration
 * @returns {void}
 */

function validate(schema, options, configuration) {
  let errors = [];

  if (Array.isArray(options)) {
    errors = Array.from(options, nestedOptions => validateObject(schema, nestedOptions));
    errors.forEach((list, idx) => {
      const applyPrefix =
      /**
       * @param {SchemaUtilErrorObject} error
       */
      error => {
        // eslint-disable-next-line no-param-reassign
        error.dataPath = `[${idx}]${error.dataPath}`;

        if (error.children) {
          error.children.forEach(applyPrefix);
        }
      };

      list.forEach(applyPrefix);
    });
    errors = errors.reduce((arr, items) => {
      arr.push(...items);
      return arr;
    }, []);
  } else {
    errors = validateObject(schema, options);
  }

  if (errors.length > 0) {
    throw new _ValidationError.default(errors, schema, configuration);
  }
}
/**
 * @param {Schema} schema
 * @param {Array<object> | object} options
 * @returns {Array<SchemaUtilErrorObject>}
 */


function validateObject(schema, options) {
  const compiledSchema = ajv.compile(schema);
  const valid = compiledSchema(options);
  if (valid) return [];
  return compiledSchema.errors ? filterErrors(compiledSchema.errors) : [];
}
/**
 * @param {Array<ErrorObject>} errors
 * @returns {Array<SchemaUtilErrorObject>}
 */


function filterErrors(errors) {
  /** @type {Array<SchemaUtilErrorObject>} */
  let newErrors = [];

  for (const error of
  /** @type {Array<SchemaUtilErrorObject>} */
  errors) {
    const {
      dataPath
    } = error;
    /** @type {Array<SchemaUtilErrorObject>} */

    let children = [];
    newErrors = newErrors.filter(oldError => {
      if (oldError.dataPath.includes(dataPath)) {
        if (oldError.children) {
          children = children.concat(oldError.children.slice(0));
        } // eslint-disable-next-line no-undefined, no-param-reassign


        oldError.children = undefined;
        children.push(oldError);
        return false;
      }

      return true;
    });

    if (children.length) {
      error.children = children;
    }

    newErrors.push(error);
  }

  return newErrors;
} // TODO change after resolve https://github.com/microsoft/TypeScript/issues/34994


validate.ValidationError = _ValidationError.default;
validate.ValidateError = _ValidationError.default;
var _default = validate;
exports.default = _default;

/***/ }),

/***/ 5911:
/***/ ((module, exports) => {

exports = module.exports = SemVer

var debug
/* istanbul ignore next */
if (typeof process === 'object' &&
    process.env &&
    process.env.NODE_DEBUG &&
    /\bsemver\b/i.test(process.env.NODE_DEBUG)) {
  debug = function () {
    var args = Array.prototype.slice.call(arguments, 0)
    args.unshift('SEMVER')
    console.log.apply(console, args)
  }
} else {
  debug = function () {}
}

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
exports.SEMVER_SPEC_VERSION = '2.0.0'

var MAX_LENGTH = 256
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
  /* istanbul ignore next */ 9007199254740991

// Max safe segment length for coercion.
var MAX_SAFE_COMPONENT_LENGTH = 16

// The actual regexps go on exports.re
var re = exports.re = []
var src = exports.src = []
var t = exports.tokens = {}
var R = 0

function tok (n) {
  t[n] = R++
}

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

tok('NUMERICIDENTIFIER')
src[t.NUMERICIDENTIFIER] = '0|[1-9]\\d*'
tok('NUMERICIDENTIFIERLOOSE')
src[t.NUMERICIDENTIFIERLOOSE] = '[0-9]+'

// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

tok('NONNUMERICIDENTIFIER')
src[t.NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*'

// ## Main Version
// Three dot-separated numeric identifiers.

tok('MAINVERSION')
src[t.MAINVERSION] = '(' + src[t.NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[t.NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[t.NUMERICIDENTIFIER] + ')'

tok('MAINVERSIONLOOSE')
src[t.MAINVERSIONLOOSE] = '(' + src[t.NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[t.NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[t.NUMERICIDENTIFIERLOOSE] + ')'

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

tok('PRERELEASEIDENTIFIER')
src[t.PRERELEASEIDENTIFIER] = '(?:' + src[t.NUMERICIDENTIFIER] +
                            '|' + src[t.NONNUMERICIDENTIFIER] + ')'

tok('PRERELEASEIDENTIFIERLOOSE')
src[t.PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[t.NUMERICIDENTIFIERLOOSE] +
                                 '|' + src[t.NONNUMERICIDENTIFIER] + ')'

// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

tok('PRERELEASE')
src[t.PRERELEASE] = '(?:-(' + src[t.PRERELEASEIDENTIFIER] +
                  '(?:\\.' + src[t.PRERELEASEIDENTIFIER] + ')*))'

tok('PRERELEASELOOSE')
src[t.PRERELEASELOOSE] = '(?:-?(' + src[t.PRERELEASEIDENTIFIERLOOSE] +
                       '(?:\\.' + src[t.PRERELEASEIDENTIFIERLOOSE] + ')*))'

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

tok('BUILDIDENTIFIER')
src[t.BUILDIDENTIFIER] = '[0-9A-Za-z-]+'

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

tok('BUILD')
src[t.BUILD] = '(?:\\+(' + src[t.BUILDIDENTIFIER] +
             '(?:\\.' + src[t.BUILDIDENTIFIER] + ')*))'

// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

tok('FULL')
tok('FULLPLAIN')
src[t.FULLPLAIN] = 'v?' + src[t.MAINVERSION] +
                  src[t.PRERELEASE] + '?' +
                  src[t.BUILD] + '?'

src[t.FULL] = '^' + src[t.FULLPLAIN] + '$'

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
tok('LOOSEPLAIN')
src[t.LOOSEPLAIN] = '[v=\\s]*' + src[t.MAINVERSIONLOOSE] +
                  src[t.PRERELEASELOOSE] + '?' +
                  src[t.BUILD] + '?'

tok('LOOSE')
src[t.LOOSE] = '^' + src[t.LOOSEPLAIN] + '$'

tok('GTLT')
src[t.GTLT] = '((?:<|>)?=?)'

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
tok('XRANGEIDENTIFIERLOOSE')
src[t.XRANGEIDENTIFIERLOOSE] = src[t.NUMERICIDENTIFIERLOOSE] + '|x|X|\\*'
tok('XRANGEIDENTIFIER')
src[t.XRANGEIDENTIFIER] = src[t.NUMERICIDENTIFIER] + '|x|X|\\*'

tok('XRANGEPLAIN')
src[t.XRANGEPLAIN] = '[v=\\s]*(' + src[t.XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[t.XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[t.XRANGEIDENTIFIER] + ')' +
                   '(?:' + src[t.PRERELEASE] + ')?' +
                   src[t.BUILD] + '?' +
                   ')?)?'

tok('XRANGEPLAINLOOSE')
src[t.XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[t.XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[t.XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[t.XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:' + src[t.PRERELEASELOOSE] + ')?' +
                        src[t.BUILD] + '?' +
                        ')?)?'

tok('XRANGE')
src[t.XRANGE] = '^' + src[t.GTLT] + '\\s*' + src[t.XRANGEPLAIN] + '$'
tok('XRANGELOOSE')
src[t.XRANGELOOSE] = '^' + src[t.GTLT] + '\\s*' + src[t.XRANGEPLAINLOOSE] + '$'

// Coercion.
// Extract anything that could conceivably be a part of a valid semver
tok('COERCE')
src[t.COERCE] = '(^|[^\\d])' +
              '(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '})' +
              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
              '(?:$|[^\\d])'
tok('COERCERTL')
re[t.COERCERTL] = new RegExp(src[t.COERCE], 'g')

// Tilde ranges.
// Meaning is "reasonably at or greater than"
tok('LONETILDE')
src[t.LONETILDE] = '(?:~>?)'

tok('TILDETRIM')
src[t.TILDETRIM] = '(\\s*)' + src[t.LONETILDE] + '\\s+'
re[t.TILDETRIM] = new RegExp(src[t.TILDETRIM], 'g')
var tildeTrimReplace = '$1~'

tok('TILDE')
src[t.TILDE] = '^' + src[t.LONETILDE] + src[t.XRANGEPLAIN] + '$'
tok('TILDELOOSE')
src[t.TILDELOOSE] = '^' + src[t.LONETILDE] + src[t.XRANGEPLAINLOOSE] + '$'

// Caret ranges.
// Meaning is "at least and backwards compatible with"
tok('LONECARET')
src[t.LONECARET] = '(?:\\^)'

tok('CARETTRIM')
src[t.CARETTRIM] = '(\\s*)' + src[t.LONECARET] + '\\s+'
re[t.CARETTRIM] = new RegExp(src[t.CARETTRIM], 'g')
var caretTrimReplace = '$1^'

tok('CARET')
src[t.CARET] = '^' + src[t.LONECARET] + src[t.XRANGEPLAIN] + '$'
tok('CARETLOOSE')
src[t.CARETLOOSE] = '^' + src[t.LONECARET] + src[t.XRANGEPLAINLOOSE] + '$'

// A simple gt/lt/eq thing, or just "" to indicate "any version"
tok('COMPARATORLOOSE')
src[t.COMPARATORLOOSE] = '^' + src[t.GTLT] + '\\s*(' + src[t.LOOSEPLAIN] + ')$|^$'
tok('COMPARATOR')
src[t.COMPARATOR] = '^' + src[t.GTLT] + '\\s*(' + src[t.FULLPLAIN] + ')$|^$'

// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
tok('COMPARATORTRIM')
src[t.COMPARATORTRIM] = '(\\s*)' + src[t.GTLT] +
                      '\\s*(' + src[t.LOOSEPLAIN] + '|' + src[t.XRANGEPLAIN] + ')'

// this one has to use the /g flag
re[t.COMPARATORTRIM] = new RegExp(src[t.COMPARATORTRIM], 'g')
var comparatorTrimReplace = '$1$2$3'

// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
tok('HYPHENRANGE')
src[t.HYPHENRANGE] = '^\\s*(' + src[t.XRANGEPLAIN] + ')' +
                   '\\s+-\\s+' +
                   '(' + src[t.XRANGEPLAIN] + ')' +
                   '\\s*$'

tok('HYPHENRANGELOOSE')
src[t.HYPHENRANGELOOSE] = '^\\s*(' + src[t.XRANGEPLAINLOOSE] + ')' +
                        '\\s+-\\s+' +
                        '(' + src[t.XRANGEPLAINLOOSE] + ')' +
                        '\\s*$'

// Star ranges basically just allow anything at all.
tok('STAR')
src[t.STAR] = '(<|>)?=?\\s*\\*'

// Compile to actual regexp objects.
// All are flag-free, unless they were created above with a flag.
for (var i = 0; i < R; i++) {
  debug(i, src[i])
  if (!re[i]) {
    re[i] = new RegExp(src[i])
  }
}

exports.parse = parse
function parse (version, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    }
  }

  if (version instanceof SemVer) {
    return version
  }

  if (typeof version !== 'string') {
    return null
  }

  if (version.length > MAX_LENGTH) {
    return null
  }

  var r = options.loose ? re[t.LOOSE] : re[t.FULL]
  if (!r.test(version)) {
    return null
  }

  try {
    return new SemVer(version, options)
  } catch (er) {
    return null
  }
}

exports.valid = valid
function valid (version, options) {
  var v = parse(version, options)
  return v ? v.version : null
}

exports.clean = clean
function clean (version, options) {
  var s = parse(version.trim().replace(/^[=v]+/, ''), options)
  return s ? s.version : null
}

exports.SemVer = SemVer

function SemVer (version, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    }
  }
  if (version instanceof SemVer) {
    if (version.loose === options.loose) {
      return version
    } else {
      version = version.version
    }
  } else if (typeof version !== 'string') {
    throw new TypeError('Invalid Version: ' + version)
  }

  if (version.length > MAX_LENGTH) {
    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')
  }

  if (!(this instanceof SemVer)) {
    return new SemVer(version, options)
  }

  debug('SemVer', version, options)
  this.options = options
  this.loose = !!options.loose

  var m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL])

  if (!m) {
    throw new TypeError('Invalid Version: ' + version)
  }

  this.raw = version

  // these are actually numbers
  this.major = +m[1]
  this.minor = +m[2]
  this.patch = +m[3]

  if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
    throw new TypeError('Invalid major version')
  }

  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
    throw new TypeError('Invalid minor version')
  }

  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
    throw new TypeError('Invalid patch version')
  }

  // numberify any prerelease numeric ids
  if (!m[4]) {
    this.prerelease = []
  } else {
    this.prerelease = m[4].split('.').map(function (id) {
      if (/^[0-9]+$/.test(id)) {
        var num = +id
        if (num >= 0 && num < MAX_SAFE_INTEGER) {
          return num
        }
      }
      return id
    })
  }

  this.build = m[5] ? m[5].split('.') : []
  this.format()
}

SemVer.prototype.format = function () {
  this.version = this.major + '.' + this.minor + '.' + this.patch
  if (this.prerelease.length) {
    this.version += '-' + this.prerelease.join('.')
  }
  return this.version
}

SemVer.prototype.toString = function () {
  return this.version
}

SemVer.prototype.compare = function (other) {
  debug('SemVer.compare', this.version, this.options, other)
  if (!(other instanceof SemVer)) {
    other = new SemVer(other, this.options)
  }

  return this.compareMain(other) || this.comparePre(other)
}

SemVer.prototype.compareMain = function (other) {
  if (!(other instanceof SemVer)) {
    other = new SemVer(other, this.options)
  }

  return compareIdentifiers(this.major, other.major) ||
         compareIdentifiers(this.minor, other.minor) ||
         compareIdentifiers(this.patch, other.patch)
}

SemVer.prototype.comparePre = function (other) {
  if (!(other instanceof SemVer)) {
    other = new SemVer(other, this.options)
  }

  // NOT having a prerelease is > having one
  if (this.prerelease.length && !other.prerelease.length) {
    return -1
  } else if (!this.prerelease.length && other.prerelease.length) {
    return 1
  } else if (!this.prerelease.length && !other.prerelease.length) {
    return 0
  }

  var i = 0
  do {
    var a = this.prerelease[i]
    var b = other.prerelease[i]
    debug('prerelease compare', i, a, b)
    if (a === undefined && b === undefined) {
      return 0
    } else if (b === undefined) {
      return 1
    } else if (a === undefined) {
      return -1
    } else if (a === b) {
      continue
    } else {
      return compareIdentifiers(a, b)
    }
  } while (++i)
}

SemVer.prototype.compareBuild = function (other) {
  if (!(other instanceof SemVer)) {
    other = new SemVer(other, this.options)
  }

  var i = 0
  do {
    var a = this.build[i]
    var b = other.build[i]
    debug('prerelease compare', i, a, b)
    if (a === undefined && b === undefined) {
      return 0
    } else if (b === undefined) {
      return 1
    } else if (a === undefined) {
      return -1
    } else if (a === b) {
      continue
    } else {
      return compareIdentifiers(a, b)
    }
  } while (++i)
}

// preminor will bump the version up to the next minor release, and immediately
// down to pre-release. premajor and prepatch work the same way.
SemVer.prototype.inc = function (release, identifier) {
  switch (release) {
    case 'premajor':
      this.prerelease.length = 0
      this.patch = 0
      this.minor = 0
      this.major++
      this.inc('pre', identifier)
      break
    case 'preminor':
      this.prerelease.length = 0
      this.patch = 0
      this.minor++
      this.inc('pre', identifier)
      break
    case 'prepatch':
      // If this is already a prerelease, it will bump to the next version
      // drop any prereleases that might already exist, since they are not
      // relevant at this point.
      this.prerelease.length = 0
      this.inc('patch', identifier)
      this.inc('pre', identifier)
      break
    // If the input is a non-prerelease version, this acts the same as
    // prepatch.
    case 'prerelease':
      if (this.prerelease.length === 0) {
        this.inc('patch', identifier)
      }
      this.inc('pre', identifier)
      break

    case 'major':
      // If this is a pre-major version, bump up to the same major version.
      // Otherwise increment major.
      // 1.0.0-5 bumps to 1.0.0
      // 1.1.0 bumps to 2.0.0
      if (this.minor !== 0 ||
          this.patch !== 0 ||
          this.prerelease.length === 0) {
        this.major++
      }
      this.minor = 0
      this.patch = 0
      this.prerelease = []
      break
    case 'minor':
      // If this is a pre-minor version, bump up to the same minor version.
      // Otherwise increment minor.
      // 1.2.0-5 bumps to 1.2.0
      // 1.2.1 bumps to 1.3.0
      if (this.patch !== 0 || this.prerelease.length === 0) {
        this.minor++
      }
      this.patch = 0
      this.prerelease = []
      break
    case 'patch':
      // If this is not a pre-release version, it will increment the patch.
      // If it is a pre-release it will bump up to the same patch version.
      // 1.2.0-5 patches to 1.2.0
      // 1.2.0 patches to 1.2.1
      if (this.prerelease.length === 0) {
        this.patch++
      }
      this.prerelease = []
      break
    // This probably shouldn't be used publicly.
    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
    case 'pre':
      if (this.prerelease.length === 0) {
        this.prerelease = [0]
      } else {
        var i = this.prerelease.length
        while (--i >= 0) {
          if (typeof this.prerelease[i] === 'number') {
            this.prerelease[i]++
            i = -2
          }
        }
        if (i === -1) {
          // didn't increment anything
          this.prerelease.push(0)
        }
      }
      if (identifier) {
        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
        if (this.prerelease[0] === identifier) {
          if (isNaN(this.prerelease[1])) {
            this.prerelease = [identifier, 0]
          }
        } else {
          this.prerelease = [identifier, 0]
        }
      }
      break

    default:
      throw new Error('invalid increment argument: ' + release)
  }
  this.format()
  this.raw = this.version
  return this
}

exports.inc = inc
function inc (version, release, loose, identifier) {
  if (typeof (loose) === 'string') {
    identifier = loose
    loose = undefined
  }

  try {
    return new SemVer(version, loose).inc(release, identifier).version
  } catch (er) {
    return null
  }
}

exports.diff = diff
function diff (version1, version2) {
  if (eq(version1, version2)) {
    return null
  } else {
    var v1 = parse(version1)
    var v2 = parse(version2)
    var prefix = ''
    if (v1.prerelease.length || v2.prerelease.length) {
      prefix = 'pre'
      var defaultResult = 'prerelease'
    }
    for (var key in v1) {
      if (key === 'major' || key === 'minor' || key === 'patch') {
        if (v1[key] !== v2[key]) {
          return prefix + key
        }
      }
    }
    return defaultResult // may be undefined
  }
}

exports.compareIdentifiers = compareIdentifiers

var numeric = /^[0-9]+$/
function compareIdentifiers (a, b) {
  var anum = numeric.test(a)
  var bnum = numeric.test(b)

  if (anum && bnum) {
    a = +a
    b = +b
  }

  return a === b ? 0
    : (anum && !bnum) ? -1
    : (bnum && !anum) ? 1
    : a < b ? -1
    : 1
}

exports.rcompareIdentifiers = rcompareIdentifiers
function rcompareIdentifiers (a, b) {
  return compareIdentifiers(b, a)
}

exports.major = major
function major (a, loose) {
  return new SemVer(a, loose).major
}

exports.minor = minor
function minor (a, loose) {
  return new SemVer(a, loose).minor
}

exports.patch = patch
function patch (a, loose) {
  return new SemVer(a, loose).patch
}

exports.compare = compare
function compare (a, b, loose) {
  return new SemVer(a, loose).compare(new SemVer(b, loose))
}

exports.compareLoose = compareLoose
function compareLoose (a, b) {
  return compare(a, b, true)
}

exports.compareBuild = compareBuild
function compareBuild (a, b, loose) {
  var versionA = new SemVer(a, loose)
  var versionB = new SemVer(b, loose)
  return versionA.compare(versionB) || versionA.compareBuild(versionB)
}

exports.rcompare = rcompare
function rcompare (a, b, loose) {
  return compare(b, a, loose)
}

exports.sort = sort
function sort (list, loose) {
  return list.sort(function (a, b) {
    return exports.compareBuild(a, b, loose)
  })
}

exports.rsort = rsort
function rsort (list, loose) {
  return list.sort(function (a, b) {
    return exports.compareBuild(b, a, loose)
  })
}

exports.gt = gt
function gt (a, b, loose) {
  return compare(a, b, loose) > 0
}

exports.lt = lt
function lt (a, b, loose) {
  return compare(a, b, loose) < 0
}

exports.eq = eq
function eq (a, b, loose) {
  return compare(a, b, loose) === 0
}

exports.neq = neq
function neq (a, b, loose) {
  return compare(a, b, loose) !== 0
}

exports.gte = gte
function gte (a, b, loose) {
  return compare(a, b, loose) >= 0
}

exports.lte = lte
function lte (a, b, loose) {
  return compare(a, b, loose) <= 0
}

exports.cmp = cmp
function cmp (a, op, b, loose) {
  switch (op) {
    case '===':
      if (typeof a === 'object')
        a = a.version
      if (typeof b === 'object')
        b = b.version
      return a === b

    case '!==':
      if (typeof a === 'object')
        a = a.version
      if (typeof b === 'object')
        b = b.version
      return a !== b

    case '':
    case '=':
    case '==':
      return eq(a, b, loose)

    case '!=':
      return neq(a, b, loose)

    case '>':
      return gt(a, b, loose)

    case '>=':
      return gte(a, b, loose)

    case '<':
      return lt(a, b, loose)

    case '<=':
      return lte(a, b, loose)

    default:
      throw new TypeError('Invalid operator: ' + op)
  }
}

exports.Comparator = Comparator
function Comparator (comp, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    }
  }

  if (comp instanceof Comparator) {
    if (comp.loose === !!options.loose) {
      return comp
    } else {
      comp = comp.value
    }
  }

  if (!(this instanceof Comparator)) {
    return new Comparator(comp, options)
  }

  debug('comparator', comp, options)
  this.options = options
  this.loose = !!options.loose
  this.parse(comp)

  if (this.semver === ANY) {
    this.value = ''
  } else {
    this.value = this.operator + this.semver.version
  }

  debug('comp', this)
}

var ANY = {}
Comparator.prototype.parse = function (comp) {
  var r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR]
  var m = comp.match(r)

  if (!m) {
    throw new TypeError('Invalid comparator: ' + comp)
  }

  this.operator = m[1] !== undefined ? m[1] : ''
  if (this.operator === '=') {
    this.operator = ''
  }

  // if it literally is just '>' or '' then allow anything.
  if (!m[2]) {
    this.semver = ANY
  } else {
    this.semver = new SemVer(m[2], this.options.loose)
  }
}

Comparator.prototype.toString = function () {
  return this.value
}

Comparator.prototype.test = function (version) {
  debug('Comparator.test', version, this.options.loose)

  if (this.semver === ANY || version === ANY) {
    return true
  }

  if (typeof version === 'string') {
    try {
      version = new SemVer(version, this.options)
    } catch (er) {
      return false
    }
  }

  return cmp(version, this.operator, this.semver, this.options)
}

Comparator.prototype.intersects = function (comp, options) {
  if (!(comp instanceof Comparator)) {
    throw new TypeError('a Comparator is required')
  }

  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    }
  }

  var rangeTmp

  if (this.operator === '') {
    if (this.value === '') {
      return true
    }
    rangeTmp = new Range(comp.value, options)
    return satisfies(this.value, rangeTmp, options)
  } else if (comp.operator === '') {
    if (comp.value === '') {
      return true
    }
    rangeTmp = new Range(this.value, options)
    return satisfies(comp.semver, rangeTmp, options)
  }

  var sameDirectionIncreasing =
    (this.operator === '>=' || this.operator === '>') &&
    (comp.operator === '>=' || comp.operator === '>')
  var sameDirectionDecreasing =
    (this.operator === '<=' || this.operator === '<') &&
    (comp.operator === '<=' || comp.operator === '<')
  var sameSemVer = this.semver.version === comp.semver.version
  var differentDirectionsInclusive =
    (this.operator === '>=' || this.operator === '<=') &&
    (comp.operator === '>=' || comp.operator === '<=')
  var oppositeDirectionsLessThan =
    cmp(this.semver, '<', comp.semver, options) &&
    ((this.operator === '>=' || this.operator === '>') &&
    (comp.operator === '<=' || comp.operator === '<'))
  var oppositeDirectionsGreaterThan =
    cmp(this.semver, '>', comp.semver, options) &&
    ((this.operator === '<=' || this.operator === '<') &&
    (comp.operator === '>=' || comp.operator === '>'))

  return sameDirectionIncreasing || sameDirectionDecreasing ||
    (sameSemVer && differentDirectionsInclusive) ||
    oppositeDirectionsLessThan || oppositeDirectionsGreaterThan
}

exports.Range = Range
function Range (range, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    }
  }

  if (range instanceof Range) {
    if (range.loose === !!options.loose &&
        range.includePrerelease === !!options.includePrerelease) {
      return range
    } else {
      return new Range(range.raw, options)
    }
  }

  if (range instanceof Comparator) {
    return new Range(range.value, options)
  }

  if (!(this instanceof Range)) {
    return new Range(range, options)
  }

  this.options = options
  this.loose = !!options.loose
  this.includePrerelease = !!options.includePrerelease

  // First, split based on boolean or ||
  this.raw = range
  this.set = range.split(/\s*\|\|\s*/).map(function (range) {
    return this.parseRange(range.trim())
  }, this).filter(function (c) {
    // throw out any that are not relevant for whatever reason
    return c.length
  })

  if (!this.set.length) {
    throw new TypeError('Invalid SemVer Range: ' + range)
  }

  this.format()
}

Range.prototype.format = function () {
  this.range = this.set.map(function (comps) {
    return comps.join(' ').trim()
  }).join('||').trim()
  return this.range
}

Range.prototype.toString = function () {
  return this.range
}

Range.prototype.parseRange = function (range) {
  var loose = this.options.loose
  range = range.trim()
  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
  var hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE]
  range = range.replace(hr, hyphenReplace)
  debug('hyphen replace', range)
  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
  range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace)
  debug('comparator trim', range, re[t.COMPARATORTRIM])

  // `~ 1.2.3` => `~1.2.3`
  range = range.replace(re[t.TILDETRIM], tildeTrimReplace)

  // `^ 1.2.3` => `^1.2.3`
  range = range.replace(re[t.CARETTRIM], caretTrimReplace)

  // normalize spaces
  range = range.split(/\s+/).join(' ')

  // At this point, the range is completely trimmed and
  // ready to be split into comparators.

  var compRe = loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR]
  var set = range.split(' ').map(function (comp) {
    return parseComparator(comp, this.options)
  }, this).join(' ').split(/\s+/)
  if (this.options.loose) {
    // in loose mode, throw out any that are not valid comparators
    set = set.filter(function (comp) {
      return !!comp.match(compRe)
    })
  }
  set = set.map(function (comp) {
    return new Comparator(comp, this.options)
  }, this)

  return set
}

Range.prototype.intersects = function (range, options) {
  if (!(range instanceof Range)) {
    throw new TypeError('a Range is required')
  }

  return this.set.some(function (thisComparators) {
    return (
      isSatisfiable(thisComparators, options) &&
      range.set.some(function (rangeComparators) {
        return (
          isSatisfiable(rangeComparators, options) &&
          thisComparators.every(function (thisComparator) {
            return rangeComparators.every(function (rangeComparator) {
              return thisComparator.intersects(rangeComparator, options)
            })
          })
        )
      })
    )
  })
}

// take a set of comparators and determine whether there
// exists a version which can satisfy it
function isSatisfiable (comparators, options) {
  var result = true
  var remainingComparators = comparators.slice()
  var testComparator = remainingComparators.pop()

  while (result && remainingComparators.length) {
    result = remainingComparators.every(function (otherComparator) {
      return testComparator.intersects(otherComparator, options)
    })

    testComparator = remainingComparators.pop()
  }

  return result
}

// Mostly just for testing and legacy API reasons
exports.toComparators = toComparators
function toComparators (range, options) {
  return new Range(range, options).set.map(function (comp) {
    return comp.map(function (c) {
      return c.value
    }).join(' ').trim().split(' ')
  })
}

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
function parseComparator (comp, options) {
  debug('comp', comp, options)
  comp = replaceCarets(comp, options)
  debug('caret', comp)
  comp = replaceTildes(comp, options)
  debug('tildes', comp)
  comp = replaceXRanges(comp, options)
  debug('xrange', comp)
  comp = replaceStars(comp, options)
  debug('stars', comp)
  return comp
}

function isX (id) {
  return !id || id.toLowerCase() === 'x' || id === '*'
}

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceTildes (comp, options) {
  return comp.trim().split(/\s+/).map(function (comp) {
    return replaceTilde(comp, options)
  }).join(' ')
}

function replaceTilde (comp, options) {
  var r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE]
  return comp.replace(r, function (_, M, m, p, pr) {
    debug('tilde', comp, _, M, m, p, pr)
    var ret

    if (isX(M)) {
      ret = ''
    } else if (isX(m)) {
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0'
    } else if (isX(p)) {
      // ~1.2 == >=1.2.0 <1.3.0
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0'
    } else if (pr) {
      debug('replaceTilde pr', pr)
      ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
            ' <' + M + '.' + (+m + 1) + '.0'
    } else {
      // ~1.2.3 == >=1.2.3 <1.3.0
      ret = '>=' + M + '.' + m + '.' + p +
            ' <' + M + '.' + (+m + 1) + '.0'
    }

    debug('tilde return', ret)
    return ret
  })
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceCarets (comp, options) {
  return comp.trim().split(/\s+/).map(function (comp) {
    return replaceCaret(comp, options)
  }).join(' ')
}

function replaceCaret (comp, options) {
  debug('caret', comp, options)
  var r = options.loose ? re[t.CARETLOOSE] : re[t.CARET]
  return comp.replace(r, function (_, M, m, p, pr) {
    debug('caret', comp, _, M, m, p, pr)
    var ret

    if (isX(M)) {
      ret = ''
    } else if (isX(m)) {
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0'
    } else if (isX(p)) {
      if (M === '0') {
        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0'
      } else {
        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0'
      }
    } else if (pr) {
      debug('replaceCaret pr', pr)
      if (M === '0') {
        if (m === '0') {
          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
                ' <' + M + '.' + m + '.' + (+p + 1)
        } else {
          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
                ' <' + M + '.' + (+m + 1) + '.0'
        }
      } else {
        ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
              ' <' + (+M + 1) + '.0.0'
      }
    } else {
      debug('no pr')
      if (M === '0') {
        if (m === '0') {
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + m + '.' + (+p + 1)
        } else {
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + (+m + 1) + '.0'
        }
      } else {
        ret = '>=' + M + '.' + m + '.' + p +
              ' <' + (+M + 1) + '.0.0'
      }
    }

    debug('caret return', ret)
    return ret
  })
}

function replaceXRanges (comp, options) {
  debug('replaceXRanges', comp, options)
  return comp.split(/\s+/).map(function (comp) {
    return replaceXRange(comp, options)
  }).join(' ')
}

function replaceXRange (comp, options) {
  comp = comp.trim()
  var r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE]
  return comp.replace(r, function (ret, gtlt, M, m, p, pr) {
    debug('xRange', comp, ret, gtlt, M, m, p, pr)
    var xM = isX(M)
    var xm = xM || isX(m)
    var xp = xm || isX(p)
    var anyX = xp

    if (gtlt === '=' && anyX) {
      gtlt = ''
    }

    // if we're including prereleases in the match, then we need
    // to fix this to -0, the lowest possible prerelease value
    pr = options.includePrerelease ? '-0' : ''

    if (xM) {
      if (gtlt === '>' || gtlt === '<') {
        // nothing is allowed
        ret = '<0.0.0-0'
      } else {
        // nothing is forbidden
        ret = '*'
      }
    } else if (gtlt && anyX) {
      // we know patch is an x, because we have any x at all.
      // replace X with 0
      if (xm) {
        m = 0
      }
      p = 0

      if (gtlt === '>') {
        // >1 => >=2.0.0
        // >1.2 => >=1.3.0
        // >1.2.3 => >= 1.2.4
        gtlt = '>='
        if (xm) {
          M = +M + 1
          m = 0
          p = 0
        } else {
          m = +m + 1
          p = 0
        }
      } else if (gtlt === '<=') {
        // <=0.7.x is actually <0.8.0, since any 0.7.x should
        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
        gtlt = '<'
        if (xm) {
          M = +M + 1
        } else {
          m = +m + 1
        }
      }

      ret = gtlt + M + '.' + m + '.' + p + pr
    } else if (xm) {
      ret = '>=' + M + '.0.0' + pr + ' <' + (+M + 1) + '.0.0' + pr
    } else if (xp) {
      ret = '>=' + M + '.' + m + '.0' + pr +
        ' <' + M + '.' + (+m + 1) + '.0' + pr
    }

    debug('xRange return', ret)

    return ret
  })
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars (comp, options) {
  debug('replaceStars', comp, options)
  // Looseness is ignored here.  star is always as loose as it gets!
  return comp.trim().replace(re[t.STAR], '')
}

// This function is passed to string.replace(re[t.HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0
function hyphenReplace ($0,
  from, fM, fm, fp, fpr, fb,
  to, tM, tm, tp, tpr, tb) {
  if (isX(fM)) {
    from = ''
  } else if (isX(fm)) {
    from = '>=' + fM + '.0.0'
  } else if (isX(fp)) {
    from = '>=' + fM + '.' + fm + '.0'
  } else {
    from = '>=' + from
  }

  if (isX(tM)) {
    to = ''
  } else if (isX(tm)) {
    to = '<' + (+tM + 1) + '.0.0'
  } else if (isX(tp)) {
    to = '<' + tM + '.' + (+tm + 1) + '.0'
  } else if (tpr) {
    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr
  } else {
    to = '<=' + to
  }

  return (from + ' ' + to).trim()
}

// if ANY of the sets match ALL of its comparators, then pass
Range.prototype.test = function (version) {
  if (!version) {
    return false
  }

  if (typeof version === 'string') {
    try {
      version = new SemVer(version, this.options)
    } catch (er) {
      return false
    }
  }

  for (var i = 0; i < this.set.length; i++) {
    if (testSet(this.set[i], version, this.options)) {
      return true
    }
  }
  return false
}

function testSet (set, version, options) {
  for (var i = 0; i < set.length; i++) {
    if (!set[i].test(version)) {
      return false
    }
  }

  if (version.prerelease.length && !options.includePrerelease) {
    // Find the set of versions that are allowed to have prereleases
    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
    // That should allow `1.2.3-pr.2` to pass.
    // However, `1.2.4-alpha.notready` should NOT be allowed,
    // even though it's within the range set by the comparators.
    for (i = 0; i < set.length; i++) {
      debug(set[i].semver)
      if (set[i].semver === ANY) {
        continue
      }

      if (set[i].semver.prerelease.length > 0) {
        var allowed = set[i].semver
        if (allowed.major === version.major &&
            allowed.minor === version.minor &&
            allowed.patch === version.patch) {
          return true
        }
      }
    }

    // Version has a -pre, but it's not one of the ones we like.
    return false
  }

  return true
}

exports.satisfies = satisfies
function satisfies (version, range, options) {
  try {
    range = new Range(range, options)
  } catch (er) {
    return false
  }
  return range.test(version)
}

exports.maxSatisfying = maxSatisfying
function maxSatisfying (versions, range, options) {
  var max = null
  var maxSV = null
  try {
    var rangeObj = new Range(range, options)
  } catch (er) {
    return null
  }
  versions.forEach(function (v) {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!max || maxSV.compare(v) === -1) {
        // compare(max, v, true)
        max = v
        maxSV = new SemVer(max, options)
      }
    }
  })
  return max
}

exports.minSatisfying = minSatisfying
function minSatisfying (versions, range, options) {
  var min = null
  var minSV = null
  try {
    var rangeObj = new Range(range, options)
  } catch (er) {
    return null
  }
  versions.forEach(function (v) {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!min || minSV.compare(v) === 1) {
        // compare(min, v, true)
        min = v
        minSV = new SemVer(min, options)
      }
    }
  })
  return min
}

exports.minVersion = minVersion
function minVersion (range, loose) {
  range = new Range(range, loose)

  var minver = new SemVer('0.0.0')
  if (range.test(minver)) {
    return minver
  }

  minver = new SemVer('0.0.0-0')
  if (range.test(minver)) {
    return minver
  }

  minver = null
  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i]

    comparators.forEach(function (comparator) {
      // Clone to avoid manipulating the comparator's semver object.
      var compver = new SemVer(comparator.semver.version)
      switch (comparator.operator) {
        case '>':
          if (compver.prerelease.length === 0) {
            compver.patch++
          } else {
            compver.prerelease.push(0)
          }
          compver.raw = compver.format()
          /* fallthrough */
        case '':
        case '>=':
          if (!minver || gt(minver, compver)) {
            minver = compver
          }
          break
        case '<':
        case '<=':
          /* Ignore maximum versions */
          break
        /* istanbul ignore next */
        default:
          throw new Error('Unexpected operation: ' + comparator.operator)
      }
    })
  }

  if (minver && range.test(minver)) {
    return minver
  }

  return null
}

exports.validRange = validRange
function validRange (range, options) {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range(range, options).range || '*'
  } catch (er) {
    return null
  }
}

// Determine if version is less than all the versions possible in the range
exports.ltr = ltr
function ltr (version, range, options) {
  return outside(version, range, '<', options)
}

// Determine if version is greater than all the versions possible in the range.
exports.gtr = gtr
function gtr (version, range, options) {
  return outside(version, range, '>', options)
}

exports.outside = outside
function outside (version, range, hilo, options) {
  version = new SemVer(version, options)
  range = new Range(range, options)

  var gtfn, ltefn, ltfn, comp, ecomp
  switch (hilo) {
    case '>':
      gtfn = gt
      ltefn = lte
      ltfn = lt
      comp = '>'
      ecomp = '>='
      break
    case '<':
      gtfn = lt
      ltefn = gte
      ltfn = gt
      comp = '<'
      ecomp = '<='
      break
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"')
  }

  // If it satisifes the range it is not outside
  if (satisfies(version, range, options)) {
    return false
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i]

    var high = null
    var low = null

    comparators.forEach(function (comparator) {
      if (comparator.semver === ANY) {
        comparator = new Comparator('>=0.0.0')
      }
      high = high || comparator
      low = low || comparator
      if (gtfn(comparator.semver, high.semver, options)) {
        high = comparator
      } else if (ltfn(comparator.semver, low.semver, options)) {
        low = comparator
      }
    })

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false
    }
  }
  return true
}

exports.prerelease = prerelease
function prerelease (version, options) {
  var parsed = parse(version, options)
  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
}

exports.intersects = intersects
function intersects (r1, r2, options) {
  r1 = new Range(r1, options)
  r2 = new Range(r2, options)
  return r1.intersects(r2)
}

exports.coerce = coerce
function coerce (version, options) {
  if (version instanceof SemVer) {
    return version
  }

  if (typeof version === 'number') {
    version = String(version)
  }

  if (typeof version !== 'string') {
    return null
  }

  options = options || {}

  var match = null
  if (!options.rtl) {
    match = version.match(re[t.COERCE])
  } else {
    // Find the right-most coercible string that does not share
    // a terminus with a more left-ward coercible string.
    // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
    //
    // Walk through the string checking with a /g regexp
    // Manually set the index so as to pick up overlapping matches.
    // Stop when we get a match that ends at the string end, since no
    // coercible string can be more right-ward without the same terminus.
    var next
    while ((next = re[t.COERCERTL].exec(version)) &&
      (!match || match.index + match[0].length !== version.length)
    ) {
      if (!match ||
          next.index + next[0].length !== match.index + match[0].length) {
        match = next
      }
      re[t.COERCERTL].lastIndex = next.index + next[1].length + next[2].length
    }
    // leave it in a clean state
    re[t.COERCERTL].lastIndex = -1
  }

  if (match === null) {
    return null
  }

  return parse(match[2] +
    '.' + (match[3] || '0') +
    '.' + (match[4] || '0'), options)
}


/***/ }),

/***/ 5509:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/*!
 * shallow-clone <https://github.com/jonschlinkert/shallow-clone>
 *
 * Copyright (c) 2015-present, Jon Schlinkert.
 * Released under the MIT License.
 */



const valueOf = Symbol.prototype.valueOf;
const typeOf = __webpack_require__(6961);

function clone(val, deep) {
  switch (typeOf(val)) {
    case 'array':
      return val.slice();
    case 'object':
      return Object.assign({}, val);
    case 'date':
      return new val.constructor(Number(val));
    case 'map':
      return new Map(val);
    case 'set':
      return new Set(val);
    case 'buffer':
      return cloneBuffer(val);
    case 'symbol':
      return cloneSymbol(val);
    case 'arraybuffer':
      return cloneArrayBuffer(val);
    case 'float32array':
    case 'float64array':
    case 'int16array':
    case 'int32array':
    case 'int8array':
    case 'uint16array':
    case 'uint32array':
    case 'uint8clampedarray':
    case 'uint8array':
      return cloneTypedArray(val);
    case 'regexp':
      return cloneRegExp(val);
    case 'error':
      return Object.create(val);
    default: {
      return val;
    }
  }
}

function cloneRegExp(val) {
  const flags = val.flags !== void 0 ? val.flags : (/\w+$/.exec(val) || void 0);
  const re = new val.constructor(val.source, flags);
  re.lastIndex = val.lastIndex;
  return re;
}

function cloneArrayBuffer(val) {
  const res = new val.constructor(val.byteLength);
  new Uint8Array(res).set(new Uint8Array(val));
  return res;
}

function cloneTypedArray(val, deep) {
  return new val.constructor(val.buffer, val.byteOffset, val.length);
}

function cloneBuffer(val) {
  const len = val.length;
  const buf = Buffer.allocUnsafe ? Buffer.allocUnsafe(len) : Buffer.from(len);
  val.copy(buf);
  return buf;
}

function cloneSymbol(val) {
  return valueOf ? Object(valueOf.call(val)) : {};
}

/**
 * Expose `clone`
 */

module.exports = clone;


/***/ }),

/***/ 6979:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var glob = __webpack_require__(1957)
var path = __webpack_require__(5622)

function trueCasePathSync(fsPath) {

  // Normalize the path so as to resolve . and .. components.
  // !! As of Node v4.1.1, a path starting with ../ is NOT resolved relative
  // !! to the current dir, and glob.sync() below then fails.
  // !! When in doubt, resolve with fs.realPathSync() *beforehand*.
  var fsPathNormalized = path.normalize(fsPath)

  // OSX: HFS+ stores filenames in NFD (decomposed normal form) Unicode format,
  // so we must ensure that the input path is in that format first.
  if (process.platform === 'darwin') fsPathNormalized = fsPathNormalized.normalize('NFD')

  // !! Windows: Curiously, the drive component mustn't be part of a glob,
  // !! otherwise glob.sync() will invariably match nothing.
  // !! Thus, we remove the drive component and instead pass it in as the 'cwd'
  // !! (working dir.) property below.
  var pathRoot = path.parse(fsPathNormalized).root
  var noDrivePath = fsPathNormalized.slice(Math.max(pathRoot.length - 1, 0))

  // Perform case-insensitive globbing (on Windows, relative to the drive /
  // network share) and return the 1st match, if any.
  // Fortunately, glob() with nocase case-corrects the input even if it is
  // a *literal* path.
  return glob.sync(noDrivePath, { nocase: true, cwd: pathRoot })[0]
}

module.exports = trueCasePathSync


/***/ }),

/***/ 20:
/***/ (function(__unused_webpack_module, exports) {

/** @license URI.js v4.4.0 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */
(function (global, factory) {
	 true ? factory(exports) :
	0;
}(this, (function (exports) { 'use strict';

function merge() {
    for (var _len = arguments.length, sets = Array(_len), _key = 0; _key < _len; _key++) {
        sets[_key] = arguments[_key];
    }

    if (sets.length > 1) {
        sets[0] = sets[0].slice(0, -1);
        var xl = sets.length - 1;
        for (var x = 1; x < xl; ++x) {
            sets[x] = sets[x].slice(1, -1);
        }
        sets[xl] = sets[xl].slice(1);
        return sets.join('');
    } else {
        return sets[0];
    }
}
function subexp(str) {
    return "(?:" + str + ")";
}
function typeOf(o) {
    return o === undefined ? "undefined" : o === null ? "null" : Object.prototype.toString.call(o).split(" ").pop().split("]").shift().toLowerCase();
}
function toUpperCase(str) {
    return str.toUpperCase();
}
function toArray(obj) {
    return obj !== undefined && obj !== null ? obj instanceof Array ? obj : typeof obj.length !== "number" || obj.split || obj.setInterval || obj.call ? [obj] : Array.prototype.slice.call(obj) : [];
}
function assign(target, source) {
    var obj = target;
    if (source) {
        for (var key in source) {
            obj[key] = source[key];
        }
    }
    return obj;
}

function buildExps(isIRI) {
    var ALPHA$$ = "[A-Za-z]",
        CR$ = "[\\x0D]",
        DIGIT$$ = "[0-9]",
        DQUOTE$$ = "[\\x22]",
        HEXDIG$$ = merge(DIGIT$$, "[A-Fa-f]"),
        //case-insensitive
    LF$$ = "[\\x0A]",
        SP$$ = "[\\x20]",
        PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)),
        //expanded
    GEN_DELIMS$$ = "[\\:\\/\\?\\#\\[\\]\\@]",
        SUB_DELIMS$$ = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
        RESERVED$$ = merge(GEN_DELIMS$$, SUB_DELIMS$$),
        UCSCHAR$$ = isIRI ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]" : "[]",
        //subset, excludes bidi control characters
    IPRIVATE$$ = isIRI ? "[\\uE000-\\uF8FF]" : "[]",
        //subset
    UNRESERVED$$ = merge(ALPHA$$, DIGIT$$, "[\\-\\.\\_\\~]", UCSCHAR$$),
        SCHEME$ = subexp(ALPHA$$ + merge(ALPHA$$, DIGIT$$, "[\\+\\-\\.]") + "*"),
        USERINFO$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]")) + "*"),
        DEC_OCTET$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("[1-9]" + DIGIT$$) + "|" + DIGIT$$),
        DEC_OCTET_RELAXED$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("0?[1-9]" + DIGIT$$) + "|0?0?" + DIGIT$$),
        //relaxed parsing rules
    IPV4ADDRESS$ = subexp(DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$),
        H16$ = subexp(HEXDIG$$ + "{1,4}"),
        LS32$ = subexp(subexp(H16$ + "\\:" + H16$) + "|" + IPV4ADDRESS$),
        IPV6ADDRESS1$ = subexp(subexp(H16$ + "\\:") + "{6}" + LS32$),
        //                           6( h16 ":" ) ls32
    IPV6ADDRESS2$ = subexp("\\:\\:" + subexp(H16$ + "\\:") + "{5}" + LS32$),
        //                      "::" 5( h16 ":" ) ls32
    IPV6ADDRESS3$ = subexp(subexp(H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{4}" + LS32$),
        //[               h16 ] "::" 4( h16 ":" ) ls32
    IPV6ADDRESS4$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,1}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{3}" + LS32$),
        //[ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
    IPV6ADDRESS5$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,2}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{2}" + LS32$),
        //[ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
    IPV6ADDRESS6$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,3}" + H16$) + "?\\:\\:" + H16$ + "\\:" + LS32$),
        //[ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
    IPV6ADDRESS7$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,4}" + H16$) + "?\\:\\:" + LS32$),
        //[ *4( h16 ":" ) h16 ] "::"              ls32
    IPV6ADDRESS8$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,5}" + H16$) + "?\\:\\:" + H16$),
        //[ *5( h16 ":" ) h16 ] "::"              h16
    IPV6ADDRESS9$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,6}" + H16$) + "?\\:\\:"),
        //[ *6( h16 ":" ) h16 ] "::"
    IPV6ADDRESS$ = subexp([IPV6ADDRESS1$, IPV6ADDRESS2$, IPV6ADDRESS3$, IPV6ADDRESS4$, IPV6ADDRESS5$, IPV6ADDRESS6$, IPV6ADDRESS7$, IPV6ADDRESS8$, IPV6ADDRESS9$].join("|")),
        ZONEID$ = subexp(subexp(UNRESERVED$$ + "|" + PCT_ENCODED$) + "+"),
        //RFC 6874
    IPV6ADDRZ$ = subexp(IPV6ADDRESS$ + "\\%25" + ZONEID$),
        //RFC 6874
    IPV6ADDRZ_RELAXED$ = subexp(IPV6ADDRESS$ + subexp("\\%25|\\%(?!" + HEXDIG$$ + "{2})") + ZONEID$),
        //RFC 6874, with relaxed parsing rules
    IPVFUTURE$ = subexp("[vV]" + HEXDIG$$ + "+\\." + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]") + "+"),
        IP_LITERAL$ = subexp("\\[" + subexp(IPV6ADDRZ_RELAXED$ + "|" + IPV6ADDRESS$ + "|" + IPVFUTURE$) + "\\]"),
        //RFC 6874
    REG_NAME$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$)) + "*"),
        HOST$ = subexp(IP_LITERAL$ + "|" + IPV4ADDRESS$ + "(?!" + REG_NAME$ + ")" + "|" + REG_NAME$),
        PORT$ = subexp(DIGIT$$ + "*"),
        AUTHORITY$ = subexp(subexp(USERINFO$ + "@") + "?" + HOST$ + subexp("\\:" + PORT$) + "?"),
        PCHAR$ = subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@]")),
        SEGMENT$ = subexp(PCHAR$ + "*"),
        SEGMENT_NZ$ = subexp(PCHAR$ + "+"),
        SEGMENT_NZ_NC$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\@]")) + "+"),
        PATH_ABEMPTY$ = subexp(subexp("\\/" + SEGMENT$) + "*"),
        PATH_ABSOLUTE$ = subexp("\\/" + subexp(SEGMENT_NZ$ + PATH_ABEMPTY$) + "?"),
        //simplified
    PATH_NOSCHEME$ = subexp(SEGMENT_NZ_NC$ + PATH_ABEMPTY$),
        //simplified
    PATH_ROOTLESS$ = subexp(SEGMENT_NZ$ + PATH_ABEMPTY$),
        //simplified
    PATH_EMPTY$ = "(?!" + PCHAR$ + ")",
        PATH$ = subexp(PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$),
        QUERY$ = subexp(subexp(PCHAR$ + "|" + merge("[\\/\\?]", IPRIVATE$$)) + "*"),
        FRAGMENT$ = subexp(subexp(PCHAR$ + "|[\\/\\?]") + "*"),
        HIER_PART$ = subexp(subexp("\\/\\/" + AUTHORITY$ + PATH_ABEMPTY$) + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$),
        URI$ = subexp(SCHEME$ + "\\:" + HIER_PART$ + subexp("\\?" + QUERY$) + "?" + subexp("\\#" + FRAGMENT$) + "?"),
        RELATIVE_PART$ = subexp(subexp("\\/\\/" + AUTHORITY$ + PATH_ABEMPTY$) + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_EMPTY$),
        RELATIVE$ = subexp(RELATIVE_PART$ + subexp("\\?" + QUERY$) + "?" + subexp("\\#" + FRAGMENT$) + "?"),
        URI_REFERENCE$ = subexp(URI$ + "|" + RELATIVE$),
        ABSOLUTE_URI$ = subexp(SCHEME$ + "\\:" + HIER_PART$ + subexp("\\?" + QUERY$) + "?"),
        GENERIC_REF$ = "^(" + SCHEME$ + ")\\:" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?" + subexp("\\#(" + FRAGMENT$ + ")") + "?$",
        RELATIVE_REF$ = "^(){0}" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?" + subexp("\\#(" + FRAGMENT$ + ")") + "?$",
        ABSOLUTE_REF$ = "^(" + SCHEME$ + ")\\:" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?$",
        SAMEDOC_REF$ = "^" + subexp("\\#(" + FRAGMENT$ + ")") + "?$",
        AUTHORITY_REF$ = "^" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?$";
    return {
        NOT_SCHEME: new RegExp(merge("[^]", ALPHA$$, DIGIT$$, "[\\+\\-\\.]"), "g"),
        NOT_USERINFO: new RegExp(merge("[^\\%\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_HOST: new RegExp(merge("[^\\%\\[\\]\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_PATH: new RegExp(merge("[^\\%\\/\\:\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_PATH_NOSCHEME: new RegExp(merge("[^\\%\\/\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_QUERY: new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]", IPRIVATE$$), "g"),
        NOT_FRAGMENT: new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]"), "g"),
        ESCAPE: new RegExp(merge("[^]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        UNRESERVED: new RegExp(UNRESERVED$$, "g"),
        OTHER_CHARS: new RegExp(merge("[^\\%]", UNRESERVED$$, RESERVED$$), "g"),
        PCT_ENCODED: new RegExp(PCT_ENCODED$, "g"),
        IPV4ADDRESS: new RegExp("^(" + IPV4ADDRESS$ + ")$"),
        IPV6ADDRESS: new RegExp("^\\[?(" + IPV6ADDRESS$ + ")" + subexp(subexp("\\%25|\\%(?!" + HEXDIG$$ + "{2})") + "(" + ZONEID$ + ")") + "?\\]?$") //RFC 6874, with relaxed parsing rules
    };
}
var URI_PROTOCOL = buildExps(false);

var IRI_PROTOCOL = buildExps(true);

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();













var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/** Highest positive signed 32-bit float value */

var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

/** Bootstring parameters */
var base = 36;
var tMin = 1;
var tMax = 26;
var skew = 38;
var damp = 700;
var initialBias = 72;
var initialN = 128; // 0x80
var delimiter = '-'; // '\x2D'

/** Regular expressions */
var regexPunycode = /^xn--/;
var regexNonASCII = /[^\0-\x7E]/; // non-ASCII chars
var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

/** Error messages */
var errors = {
	'overflow': 'Overflow: input needs wider integers to process',
	'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
	'invalid-input': 'Invalid input'
};

/** Convenience shortcuts */
var baseMinusTMin = base - tMin;
var floor = Math.floor;
var stringFromCharCode = String.fromCharCode;

/*--------------------------------------------------------------------------*/

/**
 * A generic error utility function.
 * @private
 * @param {String} type The error type.
 * @returns {Error} Throws a `RangeError` with the applicable error message.
 */
function error$1(type) {
	throw new RangeError(errors[type]);
}

/**
 * A generic `Array#map` utility function.
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} callback The function that gets called for every array
 * item.
 * @returns {Array} A new array of values returned by the callback function.
 */
function map(array, fn) {
	var result = [];
	var length = array.length;
	while (length--) {
		result[length] = fn(array[length]);
	}
	return result;
}

/**
 * A simple `Array#map`-like wrapper to work with domain name strings or email
 * addresses.
 * @private
 * @param {String} domain The domain name or email address.
 * @param {Function} callback The function that gets called for every
 * character.
 * @returns {Array} A new string of characters returned by the callback
 * function.
 */
function mapDomain(string, fn) {
	var parts = string.split('@');
	var result = '';
	if (parts.length > 1) {
		// In email addresses, only the domain name should be punycoded. Leave
		// the local part (i.e. everything up to `@`) intact.
		result = parts[0] + '@';
		string = parts[1];
	}
	// Avoid `split(regex)` for IE8 compatibility. See #17.
	string = string.replace(regexSeparators, '\x2E');
	var labels = string.split('.');
	var encoded = map(labels, fn).join('.');
	return result + encoded;
}

/**
 * Creates an array containing the numeric code points of each Unicode
 * character in the string. While JavaScript uses UCS-2 internally,
 * this function will convert a pair of surrogate halves (each of which
 * UCS-2 exposes as separate characters) into a single code point,
 * matching UTF-16.
 * @see `punycode.ucs2.encode`
 * @see <https://mathiasbynens.be/notes/javascript-encoding>
 * @memberOf punycode.ucs2
 * @name decode
 * @param {String} string The Unicode input string (UCS-2).
 * @returns {Array} The new array of code points.
 */
function ucs2decode(string) {
	var output = [];
	var counter = 0;
	var length = string.length;
	while (counter < length) {
		var value = string.charCodeAt(counter++);
		if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
			// It's a high surrogate, and there is a next character.
			var extra = string.charCodeAt(counter++);
			if ((extra & 0xFC00) == 0xDC00) {
				// Low surrogate.
				output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
			} else {
				// It's an unmatched surrogate; only append this code unit, in case the
				// next code unit is the high surrogate of a surrogate pair.
				output.push(value);
				counter--;
			}
		} else {
			output.push(value);
		}
	}
	return output;
}

/**
 * Creates a string based on an array of numeric code points.
 * @see `punycode.ucs2.decode`
 * @memberOf punycode.ucs2
 * @name encode
 * @param {Array} codePoints The array of numeric code points.
 * @returns {String} The new Unicode string (UCS-2).
 */
var ucs2encode = function ucs2encode(array) {
	return String.fromCodePoint.apply(String, toConsumableArray(array));
};

/**
 * Converts a basic code point into a digit/integer.
 * @see `digitToBasic()`
 * @private
 * @param {Number} codePoint The basic numeric code point value.
 * @returns {Number} The numeric value of a basic code point (for use in
 * representing integers) in the range `0` to `base - 1`, or `base` if
 * the code point does not represent a value.
 */
var basicToDigit = function basicToDigit(codePoint) {
	if (codePoint - 0x30 < 0x0A) {
		return codePoint - 0x16;
	}
	if (codePoint - 0x41 < 0x1A) {
		return codePoint - 0x41;
	}
	if (codePoint - 0x61 < 0x1A) {
		return codePoint - 0x61;
	}
	return base;
};

/**
 * Converts a digit/integer into a basic code point.
 * @see `basicToDigit()`
 * @private
 * @param {Number} digit The numeric value of a basic code point.
 * @returns {Number} The basic code point whose value (when used for
 * representing integers) is `digit`, which needs to be in the range
 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
 * used; else, the lowercase form is used. The behavior is undefined
 * if `flag` is non-zero and `digit` has no uppercase form.
 */
var digitToBasic = function digitToBasic(digit, flag) {
	//  0..25 map to ASCII a..z or A..Z
	// 26..35 map to ASCII 0..9
	return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
};

/**
 * Bias adaptation function as per section 3.4 of RFC 3492.
 * https://tools.ietf.org/html/rfc3492#section-3.4
 * @private
 */
var adapt = function adapt(delta, numPoints, firstTime) {
	var k = 0;
	delta = firstTime ? floor(delta / damp) : delta >> 1;
	delta += floor(delta / numPoints);
	for (; /* no initialization */delta > baseMinusTMin * tMax >> 1; k += base) {
		delta = floor(delta / baseMinusTMin);
	}
	return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
};

/**
 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
 * symbols.
 * @memberOf punycode
 * @param {String} input The Punycode string of ASCII-only symbols.
 * @returns {String} The resulting string of Unicode symbols.
 */
var decode = function decode(input) {
	// Don't use UCS-2.
	var output = [];
	var inputLength = input.length;
	var i = 0;
	var n = initialN;
	var bias = initialBias;

	// Handle the basic code points: let `basic` be the number of input code
	// points before the last delimiter, or `0` if there is none, then copy
	// the first basic code points to the output.

	var basic = input.lastIndexOf(delimiter);
	if (basic < 0) {
		basic = 0;
	}

	for (var j = 0; j < basic; ++j) {
		// if it's not a basic code point
		if (input.charCodeAt(j) >= 0x80) {
			error$1('not-basic');
		}
		output.push(input.charCodeAt(j));
	}

	// Main decoding loop: start just after the last delimiter if any basic code
	// points were copied; start at the beginning otherwise.

	for (var index = basic > 0 ? basic + 1 : 0; index < inputLength;) /* no final expression */{

		// `index` is the index of the next character to be consumed.
		// Decode a generalized variable-length integer into `delta`,
		// which gets added to `i`. The overflow checking is easier
		// if we increase `i` as we go, then subtract off its starting
		// value at the end to obtain `delta`.
		var oldi = i;
		for (var w = 1, k = base;; /* no condition */k += base) {

			if (index >= inputLength) {
				error$1('invalid-input');
			}

			var digit = basicToDigit(input.charCodeAt(index++));

			if (digit >= base || digit > floor((maxInt - i) / w)) {
				error$1('overflow');
			}

			i += digit * w;
			var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

			if (digit < t) {
				break;
			}

			var baseMinusT = base - t;
			if (w > floor(maxInt / baseMinusT)) {
				error$1('overflow');
			}

			w *= baseMinusT;
		}

		var out = output.length + 1;
		bias = adapt(i - oldi, out, oldi == 0);

		// `i` was supposed to wrap around from `out` to `0`,
		// incrementing `n` each time, so we'll fix that now:
		if (floor(i / out) > maxInt - n) {
			error$1('overflow');
		}

		n += floor(i / out);
		i %= out;

		// Insert `n` at position `i` of the output.
		output.splice(i++, 0, n);
	}

	return String.fromCodePoint.apply(String, output);
};

/**
 * Converts a string of Unicode symbols (e.g. a domain name label) to a
 * Punycode string of ASCII-only symbols.
 * @memberOf punycode
 * @param {String} input The string of Unicode symbols.
 * @returns {String} The resulting Punycode string of ASCII-only symbols.
 */
var encode = function encode(input) {
	var output = [];

	// Convert the input in UCS-2 to an array of Unicode code points.
	input = ucs2decode(input);

	// Cache the length.
	var inputLength = input.length;

	// Initialize the state.
	var n = initialN;
	var delta = 0;
	var bias = initialBias;

	// Handle the basic code points.
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = input[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var _currentValue2 = _step.value;

			if (_currentValue2 < 0x80) {
				output.push(stringFromCharCode(_currentValue2));
			}
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator.return) {
				_iterator.return();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}

	var basicLength = output.length;
	var handledCPCount = basicLength;

	// `handledCPCount` is the number of code points that have been handled;
	// `basicLength` is the number of basic code points.

	// Finish the basic string with a delimiter unless it's empty.
	if (basicLength) {
		output.push(delimiter);
	}

	// Main encoding loop:
	while (handledCPCount < inputLength) {

		// All non-basic code points < n have been handled already. Find the next
		// larger one:
		var m = maxInt;
		var _iteratorNormalCompletion2 = true;
		var _didIteratorError2 = false;
		var _iteratorError2 = undefined;

		try {
			for (var _iterator2 = input[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
				var currentValue = _step2.value;

				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow.
		} catch (err) {
			_didIteratorError2 = true;
			_iteratorError2 = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion2 && _iterator2.return) {
					_iterator2.return();
				}
			} finally {
				if (_didIteratorError2) {
					throw _iteratorError2;
				}
			}
		}

		var handledCPCountPlusOne = handledCPCount + 1;
		if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
			error$1('overflow');
		}

		delta += (m - n) * handledCPCountPlusOne;
		n = m;

		var _iteratorNormalCompletion3 = true;
		var _didIteratorError3 = false;
		var _iteratorError3 = undefined;

		try {
			for (var _iterator3 = input[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
				var _currentValue = _step3.value;

				if (_currentValue < n && ++delta > maxInt) {
					error$1('overflow');
				}
				if (_currentValue == n) {
					// Represent delta as a generalized variable-length integer.
					var q = delta;
					for (var k = base;; /* no condition */k += base) {
						var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
						if (q < t) {
							break;
						}
						var qMinusT = q - t;
						var baseMinusT = base - t;
						output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}
		} catch (err) {
			_didIteratorError3 = true;
			_iteratorError3 = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion3 && _iterator3.return) {
					_iterator3.return();
				}
			} finally {
				if (_didIteratorError3) {
					throw _iteratorError3;
				}
			}
		}

		++delta;
		++n;
	}
	return output.join('');
};

/**
 * Converts a Punycode string representing a domain name or an email address
 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
 * it doesn't matter if you call it on a string that has already been
 * converted to Unicode.
 * @memberOf punycode
 * @param {String} input The Punycoded domain name or email address to
 * convert to Unicode.
 * @returns {String} The Unicode representation of the given Punycode
 * string.
 */
var toUnicode = function toUnicode(input) {
	return mapDomain(input, function (string) {
		return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
	});
};

/**
 * Converts a Unicode string representing a domain name or an email address to
 * Punycode. Only the non-ASCII parts of the domain name will be converted,
 * i.e. it doesn't matter if you call it with a domain that's already in
 * ASCII.
 * @memberOf punycode
 * @param {String} input The domain name or email address to convert, as a
 * Unicode string.
 * @returns {String} The Punycode representation of the given domain name or
 * email address.
 */
var toASCII = function toASCII(input) {
	return mapDomain(input, function (string) {
		return regexNonASCII.test(string) ? 'xn--' + encode(string) : string;
	});
};

/*--------------------------------------------------------------------------*/

/** Define the public API */
var punycode = {
	/**
  * A string representing the current Punycode.js version number.
  * @memberOf punycode
  * @type String
  */
	'version': '2.1.0',
	/**
  * An object of methods to convert from JavaScript's internal character
  * representation (UCS-2) to Unicode code points, and back.
  * @see <https://mathiasbynens.be/notes/javascript-encoding>
  * @memberOf punycode
  * @type Object
  */
	'ucs2': {
		'decode': ucs2decode,
		'encode': ucs2encode
	},
	'decode': decode,
	'encode': encode,
	'toASCII': toASCII,
	'toUnicode': toUnicode
};

/**
 * URI.js
 *
 * @fileoverview An RFC 3986 compliant, scheme extendable URI parsing/validating/resolving library for JavaScript.
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/uri-js
 */
/**
 * Copyright 2011 Gary Court. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 *    1. Redistributions of source code must retain the above copyright notice, this list of
 *       conditions and the following disclaimer.
 *
 *    2. Redistributions in binary form must reproduce the above copyright notice, this list
 *       of conditions and the following disclaimer in the documentation and/or other materials
 *       provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY GARY COURT ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL GARY COURT OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * The views and conclusions contained in the software and documentation are those of the
 * authors and should not be interpreted as representing official policies, either expressed
 * or implied, of Gary Court.
 */
var SCHEMES = {};
function pctEncChar(chr) {
    var c = chr.charCodeAt(0);
    var e = void 0;
    if (c < 16) e = "%0" + c.toString(16).toUpperCase();else if (c < 128) e = "%" + c.toString(16).toUpperCase();else if (c < 2048) e = "%" + (c >> 6 | 192).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();else e = "%" + (c >> 12 | 224).toString(16).toUpperCase() + "%" + (c >> 6 & 63 | 128).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();
    return e;
}
function pctDecChars(str) {
    var newStr = "";
    var i = 0;
    var il = str.length;
    while (i < il) {
        var c = parseInt(str.substr(i + 1, 2), 16);
        if (c < 128) {
            newStr += String.fromCharCode(c);
            i += 3;
        } else if (c >= 194 && c < 224) {
            if (il - i >= 6) {
                var c2 = parseInt(str.substr(i + 4, 2), 16);
                newStr += String.fromCharCode((c & 31) << 6 | c2 & 63);
            } else {
                newStr += str.substr(i, 6);
            }
            i += 6;
        } else if (c >= 224) {
            if (il - i >= 9) {
                var _c = parseInt(str.substr(i + 4, 2), 16);
                var c3 = parseInt(str.substr(i + 7, 2), 16);
                newStr += String.fromCharCode((c & 15) << 12 | (_c & 63) << 6 | c3 & 63);
            } else {
                newStr += str.substr(i, 9);
            }
            i += 9;
        } else {
            newStr += str.substr(i, 3);
            i += 3;
        }
    }
    return newStr;
}
function _normalizeComponentEncoding(components, protocol) {
    function decodeUnreserved(str) {
        var decStr = pctDecChars(str);
        return !decStr.match(protocol.UNRESERVED) ? str : decStr;
    }
    if (components.scheme) components.scheme = String(components.scheme).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_SCHEME, "");
    if (components.userinfo !== undefined) components.userinfo = String(components.userinfo).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_USERINFO, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
    if (components.host !== undefined) components.host = String(components.host).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_HOST, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
    if (components.path !== undefined) components.path = String(components.path).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(components.scheme ? protocol.NOT_PATH : protocol.NOT_PATH_NOSCHEME, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
    if (components.query !== undefined) components.query = String(components.query).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_QUERY, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
    if (components.fragment !== undefined) components.fragment = String(components.fragment).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_FRAGMENT, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
    return components;
}

function _stripLeadingZeros(str) {
    return str.replace(/^0*(.*)/, "$1") || "0";
}
function _normalizeIPv4(host, protocol) {
    var matches = host.match(protocol.IPV4ADDRESS) || [];

    var _matches = slicedToArray(matches, 2),
        address = _matches[1];

    if (address) {
        return address.split(".").map(_stripLeadingZeros).join(".");
    } else {
        return host;
    }
}
function _normalizeIPv6(host, protocol) {
    var matches = host.match(protocol.IPV6ADDRESS) || [];

    var _matches2 = slicedToArray(matches, 3),
        address = _matches2[1],
        zone = _matches2[2];

    if (address) {
        var _address$toLowerCase$ = address.toLowerCase().split('::').reverse(),
            _address$toLowerCase$2 = slicedToArray(_address$toLowerCase$, 2),
            last = _address$toLowerCase$2[0],
            first = _address$toLowerCase$2[1];

        var firstFields = first ? first.split(":").map(_stripLeadingZeros) : [];
        var lastFields = last.split(":").map(_stripLeadingZeros);
        var isLastFieldIPv4Address = protocol.IPV4ADDRESS.test(lastFields[lastFields.length - 1]);
        var fieldCount = isLastFieldIPv4Address ? 7 : 8;
        var lastFieldsStart = lastFields.length - fieldCount;
        var fields = Array(fieldCount);
        for (var x = 0; x < fieldCount; ++x) {
            fields[x] = firstFields[x] || lastFields[lastFieldsStart + x] || '';
        }
        if (isLastFieldIPv4Address) {
            fields[fieldCount - 1] = _normalizeIPv4(fields[fieldCount - 1], protocol);
        }
        var allZeroFields = fields.reduce(function (acc, field, index) {
            if (!field || field === "0") {
                var lastLongest = acc[acc.length - 1];
                if (lastLongest && lastLongest.index + lastLongest.length === index) {
                    lastLongest.length++;
                } else {
                    acc.push({ index: index, length: 1 });
                }
            }
            return acc;
        }, []);
        var longestZeroFields = allZeroFields.sort(function (a, b) {
            return b.length - a.length;
        })[0];
        var newHost = void 0;
        if (longestZeroFields && longestZeroFields.length > 1) {
            var newFirst = fields.slice(0, longestZeroFields.index);
            var newLast = fields.slice(longestZeroFields.index + longestZeroFields.length);
            newHost = newFirst.join(":") + "::" + newLast.join(":");
        } else {
            newHost = fields.join(":");
        }
        if (zone) {
            newHost += "%" + zone;
        }
        return newHost;
    } else {
        return host;
    }
}
var URI_PARSE = /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?(\[[^\/?#\]]+\]|[^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n|\r)*))?/i;
var NO_MATCH_IS_UNDEFINED = "".match(/(){0}/)[1] === undefined;
function parse(uriString) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var components = {};
    var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
    if (options.reference === "suffix") uriString = (options.scheme ? options.scheme + ":" : "") + "//" + uriString;
    var matches = uriString.match(URI_PARSE);
    if (matches) {
        if (NO_MATCH_IS_UNDEFINED) {
            //store each component
            components.scheme = matches[1];
            components.userinfo = matches[3];
            components.host = matches[4];
            components.port = parseInt(matches[5], 10);
            components.path = matches[6] || "";
            components.query = matches[7];
            components.fragment = matches[8];
            //fix port number
            if (isNaN(components.port)) {
                components.port = matches[5];
            }
        } else {
            //IE FIX for improper RegExp matching
            //store each component
            components.scheme = matches[1] || undefined;
            components.userinfo = uriString.indexOf("@") !== -1 ? matches[3] : undefined;
            components.host = uriString.indexOf("//") !== -1 ? matches[4] : undefined;
            components.port = parseInt(matches[5], 10);
            components.path = matches[6] || "";
            components.query = uriString.indexOf("?") !== -1 ? matches[7] : undefined;
            components.fragment = uriString.indexOf("#") !== -1 ? matches[8] : undefined;
            //fix port number
            if (isNaN(components.port)) {
                components.port = uriString.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/) ? matches[4] : undefined;
            }
        }
        if (components.host) {
            //normalize IP hosts
            components.host = _normalizeIPv6(_normalizeIPv4(components.host, protocol), protocol);
        }
        //determine reference type
        if (components.scheme === undefined && components.userinfo === undefined && components.host === undefined && components.port === undefined && !components.path && components.query === undefined) {
            components.reference = "same-document";
        } else if (components.scheme === undefined) {
            components.reference = "relative";
        } else if (components.fragment === undefined) {
            components.reference = "absolute";
        } else {
            components.reference = "uri";
        }
        //check for reference errors
        if (options.reference && options.reference !== "suffix" && options.reference !== components.reference) {
            components.error = components.error || "URI is not a " + options.reference + " reference.";
        }
        //find scheme handler
        var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
        //check if scheme can't handle IRIs
        if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
            //if host component is a domain name
            if (components.host && (options.domainHost || schemeHandler && schemeHandler.domainHost)) {
                //convert Unicode IDN -> ASCII IDN
                try {
                    components.host = punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase());
                } catch (e) {
                    components.error = components.error || "Host's domain name can not be converted to ASCII via punycode: " + e;
                }
            }
            //convert IRI -> URI
            _normalizeComponentEncoding(components, URI_PROTOCOL);
        } else {
            //normalize encodings
            _normalizeComponentEncoding(components, protocol);
        }
        //perform scheme specific parsing
        if (schemeHandler && schemeHandler.parse) {
            schemeHandler.parse(components, options);
        }
    } else {
        components.error = components.error || "URI can not be parsed.";
    }
    return components;
}

function _recomposeAuthority(components, options) {
    var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
    var uriTokens = [];
    if (components.userinfo !== undefined) {
        uriTokens.push(components.userinfo);
        uriTokens.push("@");
    }
    if (components.host !== undefined) {
        //normalize IP hosts, add brackets and escape zone separator for IPv6
        uriTokens.push(_normalizeIPv6(_normalizeIPv4(String(components.host), protocol), protocol).replace(protocol.IPV6ADDRESS, function (_, $1, $2) {
            return "[" + $1 + ($2 ? "%25" + $2 : "") + "]";
        }));
    }
    if (typeof components.port === "number" || typeof components.port === "string") {
        uriTokens.push(":");
        uriTokens.push(String(components.port));
    }
    return uriTokens.length ? uriTokens.join("") : undefined;
}

var RDS1 = /^\.\.?\//;
var RDS2 = /^\/\.(\/|$)/;
var RDS3 = /^\/\.\.(\/|$)/;
var RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/;
function removeDotSegments(input) {
    var output = [];
    while (input.length) {
        if (input.match(RDS1)) {
            input = input.replace(RDS1, "");
        } else if (input.match(RDS2)) {
            input = input.replace(RDS2, "/");
        } else if (input.match(RDS3)) {
            input = input.replace(RDS3, "/");
            output.pop();
        } else if (input === "." || input === "..") {
            input = "";
        } else {
            var im = input.match(RDS5);
            if (im) {
                var s = im[0];
                input = input.slice(s.length);
                output.push(s);
            } else {
                throw new Error("Unexpected dot segment condition");
            }
        }
    }
    return output.join("");
}

function serialize(components) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var protocol = options.iri ? IRI_PROTOCOL : URI_PROTOCOL;
    var uriTokens = [];
    //find scheme handler
    var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
    //perform scheme specific serialization
    if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(components, options);
    if (components.host) {
        //if host component is an IPv6 address
        if (protocol.IPV6ADDRESS.test(components.host)) {}
        //TODO: normalize IPv6 address as per RFC 5952

        //if host component is a domain name
        else if (options.domainHost || schemeHandler && schemeHandler.domainHost) {
                //convert IDN via punycode
                try {
                    components.host = !options.iri ? punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase()) : punycode.toUnicode(components.host);
                } catch (e) {
                    components.error = components.error || "Host's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
                }
            }
    }
    //normalize encoding
    _normalizeComponentEncoding(components, protocol);
    if (options.reference !== "suffix" && components.scheme) {
        uriTokens.push(components.scheme);
        uriTokens.push(":");
    }
    var authority = _recomposeAuthority(components, options);
    if (authority !== undefined) {
        if (options.reference !== "suffix") {
            uriTokens.push("//");
        }
        uriTokens.push(authority);
        if (components.path && components.path.charAt(0) !== "/") {
            uriTokens.push("/");
        }
    }
    if (components.path !== undefined) {
        var s = components.path;
        if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
            s = removeDotSegments(s);
        }
        if (authority === undefined) {
            s = s.replace(/^\/\//, "/%2F"); //don't allow the path to start with "//"
        }
        uriTokens.push(s);
    }
    if (components.query !== undefined) {
        uriTokens.push("?");
        uriTokens.push(components.query);
    }
    if (components.fragment !== undefined) {
        uriTokens.push("#");
        uriTokens.push(components.fragment);
    }
    return uriTokens.join(""); //merge tokens into a string
}

function resolveComponents(base, relative) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var skipNormalization = arguments[3];

    var target = {};
    if (!skipNormalization) {
        base = parse(serialize(base, options), options); //normalize base components
        relative = parse(serialize(relative, options), options); //normalize relative components
    }
    options = options || {};
    if (!options.tolerant && relative.scheme) {
        target.scheme = relative.scheme;
        //target.authority = relative.authority;
        target.userinfo = relative.userinfo;
        target.host = relative.host;
        target.port = relative.port;
        target.path = removeDotSegments(relative.path || "");
        target.query = relative.query;
    } else {
        if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
            //target.authority = relative.authority;
            target.userinfo = relative.userinfo;
            target.host = relative.host;
            target.port = relative.port;
            target.path = removeDotSegments(relative.path || "");
            target.query = relative.query;
        } else {
            if (!relative.path) {
                target.path = base.path;
                if (relative.query !== undefined) {
                    target.query = relative.query;
                } else {
                    target.query = base.query;
                }
            } else {
                if (relative.path.charAt(0) === "/") {
                    target.path = removeDotSegments(relative.path);
                } else {
                    if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
                        target.path = "/" + relative.path;
                    } else if (!base.path) {
                        target.path = relative.path;
                    } else {
                        target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
                    }
                    target.path = removeDotSegments(target.path);
                }
                target.query = relative.query;
            }
            //target.authority = base.authority;
            target.userinfo = base.userinfo;
            target.host = base.host;
            target.port = base.port;
        }
        target.scheme = base.scheme;
    }
    target.fragment = relative.fragment;
    return target;
}

function resolve(baseURI, relativeURI, options) {
    var schemelessOptions = assign({ scheme: 'null' }, options);
    return serialize(resolveComponents(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true), schemelessOptions);
}

function normalize(uri, options) {
    if (typeof uri === "string") {
        uri = serialize(parse(uri, options), options);
    } else if (typeOf(uri) === "object") {
        uri = parse(serialize(uri, options), options);
    }
    return uri;
}

function equal(uriA, uriB, options) {
    if (typeof uriA === "string") {
        uriA = serialize(parse(uriA, options), options);
    } else if (typeOf(uriA) === "object") {
        uriA = serialize(uriA, options);
    }
    if (typeof uriB === "string") {
        uriB = serialize(parse(uriB, options), options);
    } else if (typeOf(uriB) === "object") {
        uriB = serialize(uriB, options);
    }
    return uriA === uriB;
}

function escapeComponent(str, options) {
    return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.ESCAPE : IRI_PROTOCOL.ESCAPE, pctEncChar);
}

function unescapeComponent(str, options) {
    return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.PCT_ENCODED : IRI_PROTOCOL.PCT_ENCODED, pctDecChars);
}

var handler = {
    scheme: "http",
    domainHost: true,
    parse: function parse(components, options) {
        //report missing host
        if (!components.host) {
            components.error = components.error || "HTTP URIs must have a host.";
        }
        return components;
    },
    serialize: function serialize(components, options) {
        var secure = String(components.scheme).toLowerCase() === "https";
        //normalize the default port
        if (components.port === (secure ? 443 : 80) || components.port === "") {
            components.port = undefined;
        }
        //normalize the empty path
        if (!components.path) {
            components.path = "/";
        }
        //NOTE: We do not parse query strings for HTTP URIs
        //as WWW Form Url Encoded query strings are part of the HTML4+ spec,
        //and not the HTTP spec.
        return components;
    }
};

var handler$1 = {
    scheme: "https",
    domainHost: handler.domainHost,
    parse: handler.parse,
    serialize: handler.serialize
};

function isSecure(wsComponents) {
    return typeof wsComponents.secure === 'boolean' ? wsComponents.secure : String(wsComponents.scheme).toLowerCase() === "wss";
}
//RFC 6455
var handler$2 = {
    scheme: "ws",
    domainHost: true,
    parse: function parse(components, options) {
        var wsComponents = components;
        //indicate if the secure flag is set
        wsComponents.secure = isSecure(wsComponents);
        //construct resouce name
        wsComponents.resourceName = (wsComponents.path || '/') + (wsComponents.query ? '?' + wsComponents.query : '');
        wsComponents.path = undefined;
        wsComponents.query = undefined;
        return wsComponents;
    },
    serialize: function serialize(wsComponents, options) {
        //normalize the default port
        if (wsComponents.port === (isSecure(wsComponents) ? 443 : 80) || wsComponents.port === "") {
            wsComponents.port = undefined;
        }
        //ensure scheme matches secure flag
        if (typeof wsComponents.secure === 'boolean') {
            wsComponents.scheme = wsComponents.secure ? 'wss' : 'ws';
            wsComponents.secure = undefined;
        }
        //reconstruct path from resource name
        if (wsComponents.resourceName) {
            var _wsComponents$resourc = wsComponents.resourceName.split('?'),
                _wsComponents$resourc2 = slicedToArray(_wsComponents$resourc, 2),
                path = _wsComponents$resourc2[0],
                query = _wsComponents$resourc2[1];

            wsComponents.path = path && path !== '/' ? path : undefined;
            wsComponents.query = query;
            wsComponents.resourceName = undefined;
        }
        //forbid fragment component
        wsComponents.fragment = undefined;
        return wsComponents;
    }
};

var handler$3 = {
    scheme: "wss",
    domainHost: handler$2.domainHost,
    parse: handler$2.parse,
    serialize: handler$2.serialize
};

var O = {};
var isIRI = true;
//RFC 3986
var UNRESERVED$$ = "[A-Za-z0-9\\-\\.\\_\\~" + (isIRI ? "\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF" : "") + "]";
var HEXDIG$$ = "[0-9A-Fa-f]"; //case-insensitive
var PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)); //expanded
//RFC 5322, except these symbols as per RFC 6068: @ : / ? # [ ] & ; =
//const ATEXT$$ = "[A-Za-z0-9\\!\\#\\$\\%\\&\\'\\*\\+\\-\\/\\=\\?\\^\\_\\`\\{\\|\\}\\~]";
//const WSP$$ = "[\\x20\\x09]";
//const OBS_QTEXT$$ = "[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]";  //(%d1-8 / %d11-12 / %d14-31 / %d127)
//const QTEXT$$ = merge("[\\x21\\x23-\\x5B\\x5D-\\x7E]", OBS_QTEXT$$);  //%d33 / %d35-91 / %d93-126 / obs-qtext
//const VCHAR$$ = "[\\x21-\\x7E]";
//const WSP$$ = "[\\x20\\x09]";
//const OBS_QP$ = subexp("\\\\" + merge("[\\x00\\x0D\\x0A]", OBS_QTEXT$$));  //%d0 / CR / LF / obs-qtext
//const FWS$ = subexp(subexp(WSP$$ + "*" + "\\x0D\\x0A") + "?" + WSP$$ + "+");
//const QUOTED_PAIR$ = subexp(subexp("\\\\" + subexp(VCHAR$$ + "|" + WSP$$)) + "|" + OBS_QP$);
//const QUOTED_STRING$ = subexp('\\"' + subexp(FWS$ + "?" + QCONTENT$) + "*" + FWS$ + "?" + '\\"');
var ATEXT$$ = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]";
var QTEXT$$ = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]";
var VCHAR$$ = merge(QTEXT$$, "[\\\"\\\\]");
var SOME_DELIMS$$ = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]";
var UNRESERVED = new RegExp(UNRESERVED$$, "g");
var PCT_ENCODED = new RegExp(PCT_ENCODED$, "g");
var NOT_LOCAL_PART = new RegExp(merge("[^]", ATEXT$$, "[\\.]", '[\\"]', VCHAR$$), "g");
var NOT_HFNAME = new RegExp(merge("[^]", UNRESERVED$$, SOME_DELIMS$$), "g");
var NOT_HFVALUE = NOT_HFNAME;
function decodeUnreserved(str) {
    var decStr = pctDecChars(str);
    return !decStr.match(UNRESERVED) ? str : decStr;
}
var handler$4 = {
    scheme: "mailto",
    parse: function parse$$1(components, options) {
        var mailtoComponents = components;
        var to = mailtoComponents.to = mailtoComponents.path ? mailtoComponents.path.split(",") : [];
        mailtoComponents.path = undefined;
        if (mailtoComponents.query) {
            var unknownHeaders = false;
            var headers = {};
            var hfields = mailtoComponents.query.split("&");
            for (var x = 0, xl = hfields.length; x < xl; ++x) {
                var hfield = hfields[x].split("=");
                switch (hfield[0]) {
                    case "to":
                        var toAddrs = hfield[1].split(",");
                        for (var _x = 0, _xl = toAddrs.length; _x < _xl; ++_x) {
                            to.push(toAddrs[_x]);
                        }
                        break;
                    case "subject":
                        mailtoComponents.subject = unescapeComponent(hfield[1], options);
                        break;
                    case "body":
                        mailtoComponents.body = unescapeComponent(hfield[1], options);
                        break;
                    default:
                        unknownHeaders = true;
                        headers[unescapeComponent(hfield[0], options)] = unescapeComponent(hfield[1], options);
                        break;
                }
            }
            if (unknownHeaders) mailtoComponents.headers = headers;
        }
        mailtoComponents.query = undefined;
        for (var _x2 = 0, _xl2 = to.length; _x2 < _xl2; ++_x2) {
            var addr = to[_x2].split("@");
            addr[0] = unescapeComponent(addr[0]);
            if (!options.unicodeSupport) {
                //convert Unicode IDN -> ASCII IDN
                try {
                    addr[1] = punycode.toASCII(unescapeComponent(addr[1], options).toLowerCase());
                } catch (e) {
                    mailtoComponents.error = mailtoComponents.error || "Email address's domain name can not be converted to ASCII via punycode: " + e;
                }
            } else {
                addr[1] = unescapeComponent(addr[1], options).toLowerCase();
            }
            to[_x2] = addr.join("@");
        }
        return mailtoComponents;
    },
    serialize: function serialize$$1(mailtoComponents, options) {
        var components = mailtoComponents;
        var to = toArray(mailtoComponents.to);
        if (to) {
            for (var x = 0, xl = to.length; x < xl; ++x) {
                var toAddr = String(to[x]);
                var atIdx = toAddr.lastIndexOf("@");
                var localPart = toAddr.slice(0, atIdx).replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_LOCAL_PART, pctEncChar);
                var domain = toAddr.slice(atIdx + 1);
                //convert IDN via punycode
                try {
                    domain = !options.iri ? punycode.toASCII(unescapeComponent(domain, options).toLowerCase()) : punycode.toUnicode(domain);
                } catch (e) {
                    components.error = components.error || "Email address's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
                }
                to[x] = localPart + "@" + domain;
            }
            components.path = to.join(",");
        }
        var headers = mailtoComponents.headers = mailtoComponents.headers || {};
        if (mailtoComponents.subject) headers["subject"] = mailtoComponents.subject;
        if (mailtoComponents.body) headers["body"] = mailtoComponents.body;
        var fields = [];
        for (var name in headers) {
            if (headers[name] !== O[name]) {
                fields.push(name.replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFNAME, pctEncChar) + "=" + headers[name].replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFVALUE, pctEncChar));
            }
        }
        if (fields.length) {
            components.query = fields.join("&");
        }
        return components;
    }
};

var URN_PARSE = /^([^\:]+)\:(.*)/;
//RFC 2141
var handler$5 = {
    scheme: "urn",
    parse: function parse$$1(components, options) {
        var matches = components.path && components.path.match(URN_PARSE);
        var urnComponents = components;
        if (matches) {
            var scheme = options.scheme || urnComponents.scheme || "urn";
            var nid = matches[1].toLowerCase();
            var nss = matches[2];
            var urnScheme = scheme + ":" + (options.nid || nid);
            var schemeHandler = SCHEMES[urnScheme];
            urnComponents.nid = nid;
            urnComponents.nss = nss;
            urnComponents.path = undefined;
            if (schemeHandler) {
                urnComponents = schemeHandler.parse(urnComponents, options);
            }
        } else {
            urnComponents.error = urnComponents.error || "URN can not be parsed.";
        }
        return urnComponents;
    },
    serialize: function serialize$$1(urnComponents, options) {
        var scheme = options.scheme || urnComponents.scheme || "urn";
        var nid = urnComponents.nid;
        var urnScheme = scheme + ":" + (options.nid || nid);
        var schemeHandler = SCHEMES[urnScheme];
        if (schemeHandler) {
            urnComponents = schemeHandler.serialize(urnComponents, options);
        }
        var uriComponents = urnComponents;
        var nss = urnComponents.nss;
        uriComponents.path = (nid || options.nid) + ":" + nss;
        return uriComponents;
    }
};

var UUID = /^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/;
//RFC 4122
var handler$6 = {
    scheme: "urn:uuid",
    parse: function parse(urnComponents, options) {
        var uuidComponents = urnComponents;
        uuidComponents.uuid = uuidComponents.nss;
        uuidComponents.nss = undefined;
        if (!options.tolerant && (!uuidComponents.uuid || !uuidComponents.uuid.match(UUID))) {
            uuidComponents.error = uuidComponents.error || "UUID is not valid.";
        }
        return uuidComponents;
    },
    serialize: function serialize(uuidComponents, options) {
        var urnComponents = uuidComponents;
        //normalize UUID
        urnComponents.nss = (uuidComponents.uuid || "").toLowerCase();
        return urnComponents;
    }
};

SCHEMES[handler.scheme] = handler;
SCHEMES[handler$1.scheme] = handler$1;
SCHEMES[handler$2.scheme] = handler$2;
SCHEMES[handler$3.scheme] = handler$3;
SCHEMES[handler$4.scheme] = handler$4;
SCHEMES[handler$5.scheme] = handler$5;
SCHEMES[handler$6.scheme] = handler$6;

exports.SCHEMES = SCHEMES;
exports.pctEncChar = pctEncChar;
exports.pctDecChars = pctDecChars;
exports.parse = parse;
exports.removeDotSegments = removeDotSegments;
exports.serialize = serialize;
exports.resolveComponents = resolveComponents;
exports.resolve = resolve;
exports.normalize = normalize;
exports.equal = equal;
exports.escapeComponent = escapeComponent;
exports.unescapeComponent = unescapeComponent;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=uri.all.js.map


/***/ }),

/***/ 2940:
/***/ ((module) => {

// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}


/***/ }),

/***/ 6835:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse("{\"$schema\":\"http://json-schema.org/draft-07/schema#\",\"$id\":\"https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#\",\"description\":\"Meta-schema for $data reference (JSON Schema extension proposal)\",\"type\":\"object\",\"required\":[\"$data\"],\"properties\":{\"$data\":{\"type\":\"string\",\"anyOf\":[{\"format\":\"relative-json-pointer\"},{\"format\":\"json-pointer\"}]}},\"additionalProperties\":false}");

/***/ }),

/***/ 38:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse("{\"$schema\":\"http://json-schema.org/draft-07/schema#\",\"$id\":\"http://json-schema.org/draft-07/schema#\",\"title\":\"Core schema meta-schema\",\"definitions\":{\"schemaArray\":{\"type\":\"array\",\"minItems\":1,\"items\":{\"$ref\":\"#\"}},\"nonNegativeInteger\":{\"type\":\"integer\",\"minimum\":0},\"nonNegativeIntegerDefault0\":{\"allOf\":[{\"$ref\":\"#/definitions/nonNegativeInteger\"},{\"default\":0}]},\"simpleTypes\":{\"enum\":[\"array\",\"boolean\",\"integer\",\"null\",\"number\",\"object\",\"string\"]},\"stringArray\":{\"type\":\"array\",\"items\":{\"type\":\"string\"},\"uniqueItems\":true,\"default\":[]}},\"type\":[\"object\",\"boolean\"],\"properties\":{\"$id\":{\"type\":\"string\",\"format\":\"uri-reference\"},\"$schema\":{\"type\":\"string\",\"format\":\"uri\"},\"$ref\":{\"type\":\"string\",\"format\":\"uri-reference\"},\"$comment\":{\"type\":\"string\"},\"title\":{\"type\":\"string\"},\"description\":{\"type\":\"string\"},\"default\":true,\"readOnly\":{\"type\":\"boolean\",\"default\":false},\"examples\":{\"type\":\"array\",\"items\":true},\"multipleOf\":{\"type\":\"number\",\"exclusiveMinimum\":0},\"maximum\":{\"type\":\"number\"},\"exclusiveMaximum\":{\"type\":\"number\"},\"minimum\":{\"type\":\"number\"},\"exclusiveMinimum\":{\"type\":\"number\"},\"maxLength\":{\"$ref\":\"#/definitions/nonNegativeInteger\"},\"minLength\":{\"$ref\":\"#/definitions/nonNegativeIntegerDefault0\"},\"pattern\":{\"type\":\"string\",\"format\":\"regex\"},\"additionalItems\":{\"$ref\":\"#\"},\"items\":{\"anyOf\":[{\"$ref\":\"#\"},{\"$ref\":\"#/definitions/schemaArray\"}],\"default\":true},\"maxItems\":{\"$ref\":\"#/definitions/nonNegativeInteger\"},\"minItems\":{\"$ref\":\"#/definitions/nonNegativeIntegerDefault0\"},\"uniqueItems\":{\"type\":\"boolean\",\"default\":false},\"contains\":{\"$ref\":\"#\"},\"maxProperties\":{\"$ref\":\"#/definitions/nonNegativeInteger\"},\"minProperties\":{\"$ref\":\"#/definitions/nonNegativeIntegerDefault0\"},\"required\":{\"$ref\":\"#/definitions/stringArray\"},\"additionalProperties\":{\"$ref\":\"#\"},\"definitions\":{\"type\":\"object\",\"additionalProperties\":{\"$ref\":\"#\"},\"default\":{}},\"properties\":{\"type\":\"object\",\"additionalProperties\":{\"$ref\":\"#\"},\"default\":{}},\"patternProperties\":{\"type\":\"object\",\"additionalProperties\":{\"$ref\":\"#\"},\"propertyNames\":{\"format\":\"regex\"},\"default\":{}},\"dependencies\":{\"type\":\"object\",\"additionalProperties\":{\"anyOf\":[{\"$ref\":\"#\"},{\"$ref\":\"#/definitions/stringArray\"}]}},\"propertyNames\":{\"$ref\":\"#\"},\"const\":true,\"enum\":{\"type\":\"array\",\"items\":true,\"minItems\":1,\"uniqueItems\":true},\"type\":{\"anyOf\":[{\"$ref\":\"#/definitions/simpleTypes\"},{\"type\":\"array\",\"items\":{\"$ref\":\"#/definitions/simpleTypes\"},\"minItems\":1,\"uniqueItems\":true}]},\"format\":{\"type\":\"string\"},\"contentMediaType\":{\"type\":\"string\"},\"contentEncoding\":{\"type\":\"string\"},\"if\":{\"$ref\":\"#\"},\"then\":{\"$ref\":\"#\"},\"else\":{\"$ref\":\"#\"},\"allOf\":{\"$ref\":\"#/definitions/schemaArray\"},\"anyOf\":{\"$ref\":\"#/definitions/schemaArray\"},\"oneOf\":{\"$ref\":\"#/definitions/schemaArray\"},\"not\":{\"$ref\":\"#\"}},\"default\":true}");

/***/ }),

/***/ 1246:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse("{\"name\":\"node-sass\",\"version\":\"4.14.1\",\"libsass\":\"3.5.5\",\"description\":\"Wrapper around libsass\",\"license\":\"MIT\",\"bugs\":\"https://github.com/sass/node-sass/issues\",\"homepage\":\"https://github.com/sass/node-sass\",\"repository\":{\"type\":\"git\",\"url\":\"https://github.com/sass/node-sass\"},\"author\":{\"name\":\"Andrew Nesbitt\",\"email\":\"andrewnez@gmail.com\",\"url\":\"http://andrew.github.com\"},\"engines\":{\"node\":\">=0.10.0\"},\"main\":\"lib/index.js\",\"nodeSassConfig\":{\"binarySite\":\"https://github.com/sass/node-sass/releases/download\"},\"bin\":{\"node-sass\":\"bin/node-sass\"},\"gypfile\":true,\"scripts\":{\"coverage\":\"node scripts/coverage.js\",\"install\":\"node scripts/install.js\",\"postinstall\":\"node scripts/build.js\",\"lint\":\"node_modules/.bin/eslint bin/node-sass lib scripts test\",\"test\":\"node_modules/.bin/mocha test/{*,**/**}.js\",\"build\":\"node scripts/build.js --force\",\"prepublish\":\"not-in-install && node scripts/prepublish.js || in-install\"},\"files\":[\"bin\",\"binding.gyp\",\"lib\",\"scripts\",\"src\",\"test\",\"vendor\"],\"keywords\":[\"css\",\"libsass\",\"preprocessor\",\"sass\",\"scss\",\"style\"],\"dependencies\":{\"async-foreach\":\"^0.1.3\",\"chalk\":\"^1.1.1\",\"cross-spawn\":\"^3.0.0\",\"gaze\":\"^1.0.0\",\"get-stdin\":\"^4.0.1\",\"glob\":\"^7.0.3\",\"in-publish\":\"^2.0.0\",\"lodash\":\"^4.17.15\",\"meow\":\"^3.7.0\",\"mkdirp\":\"^0.5.1\",\"nan\":\"^2.13.2\",\"node-gyp\":\"^3.8.0\",\"npmlog\":\"^4.0.0\",\"request\":\"^2.88.0\",\"sass-graph\":\"2.2.5\",\"stdout-stream\":\"^1.4.0\",\"true-case-path\":\"^1.0.2\"},\"devDependencies\":{\"coveralls\":\"^3.0.2\",\"eslint\":\"^3.4.0\",\"fs-extra\":\"^0.30.0\",\"istanbul\":\"^0.4.2\",\"mocha\":\"^3.1.2\",\"mocha-lcov-reporter\":\"^1.2.0\",\"object-merge\":\"^2.5.1\",\"read-yaml\":\"^1.0.0\",\"rimraf\":\"^2.5.2\",\"sass-spec\":\"https://github.com/sass/sass-spec.git#dc2d573\",\"unique-temp-dir\":\"^1.0.0\"}}");

/***/ }),

/***/ 4987:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse("{\"type\":\"object\",\"properties\":{\"implementation\":{\"description\":\"The implementation of the sass to be used (https://github.com/webpack-contrib/sass-loader#implementation).\",\"type\":\"object\"},\"sassOptions\":{\"description\":\"Options for `node-sass` or `sass` (`Dart Sass`) implementation. (https://github.com/webpack-contrib/sass-loader#implementation).\",\"anyOf\":[{\"type\":\"object\",\"additionalProperties\":true},{\"instanceof\":\"Function\"}]},\"prependData\":{\"description\":\"Prepends `Sass`/`SCSS` code before the actual entry file (https://github.com/webpack-contrib/sass-loader#prependdata).\",\"anyOf\":[{\"type\":\"string\"},{\"instanceof\":\"Function\"}]},\"sourceMap\":{\"description\":\"Enables/Disables generation of source maps (https://github.com/webpack-contrib/sass-loader#sourcemap).\",\"type\":\"boolean\"},\"webpackImporter\":{\"description\":\"Enables/Disables default `webpack` importer (https://github.com/webpack-contrib/sass-loader#webpackimporter).\",\"type\":\"boolean\"}},\"additionalProperties\":false}");

/***/ }),

/***/ 2357:
/***/ ((module) => {

"use strict";
module.exports = require("assert");;

/***/ }),

/***/ 6417:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");;

/***/ }),

/***/ 8614:
/***/ ((module) => {

"use strict";
module.exports = require("events");;

/***/ }),

/***/ 5747:
/***/ ((module) => {

"use strict";
module.exports = require("fs");;

/***/ }),

/***/ 2087:
/***/ ((module) => {

"use strict";
module.exports = require("os");;

/***/ }),

/***/ 5622:
/***/ ((module) => {

"use strict";
module.exports = require("path");;

/***/ }),

/***/ 1669:
/***/ ((module) => {

"use strict";
module.exports = require("util");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	__webpack_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(1915);
/******/ })()
;