import Ajv from 'ajv';

export const gameSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'seed',
    'gameType',
    'title',
    'controls',
    'mechanics',
    'difficultyCurve',
    'obstaclePattern',
    'physics',
    'colorPalette',
    'winCondition',
    'loseCondition',
    'durationSec',
  ],
  properties: {
    seed: { type: 'string', minLength: 3, maxLength: 80 },
    gameType: { enum: ['runner', 'parkour', 'reaction', 'clicker', 'physics'] },
    title: { type: 'string', minLength: 3, maxLength: 80 },
    controls: {
      type: 'object',
      additionalProperties: false,
      required: ['touch', 'keyboard'],
      properties: {
        touch: { type: 'string' },
        keyboard: { type: 'string' },
      },
    },
    mechanics: { type: 'object' },
    difficultyCurve: {
      type: 'object',
      additionalProperties: false,
      required: ['start', 'end', 'durationSec'],
      properties: {
        start: { type: 'number', minimum: 0, maximum: 1 },
        end: { type: 'number', minimum: 0, maximum: 1 },
        durationSec: { type: 'integer', minimum: 5, maximum: 300 },
      },
    },
    obstaclePattern: { type: 'object' },
    physics: { type: 'object' },
    colorPalette: {
      type: 'array',
      minItems: 3,
      maxItems: 8,
      items: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    },
    winCondition: { type: 'string', minLength: 3 },
    loseCondition: { type: 'string', minLength: 3 },
    durationSec: { type: 'integer', minimum: 10, maximum: 180 },
  },
};

const ajv = new Ajv({ allErrors: true });
const validateGameSchema = ajv.compile(gameSchema);

export function validateGameConfig(config) {
  const valid = validateGameSchema(config);
  if (!valid) {
    const msg = validateGameSchema.errors?.map((e) => `${e.instancePath} ${e.message}`).join(', ');
    throw new Error(`Invalid game config: ${msg}`);
  }
  return config;
}
