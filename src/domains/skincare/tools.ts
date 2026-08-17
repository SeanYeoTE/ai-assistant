import type Anthropic from '@anthropic-ai/sdk';

import { addProduct, addRoutineStep, logStepDone } from './actions';
import type { TimeOfDay } from './types';
import type { ToolExecutor } from '@/voice/types';

// Tool definitions in Anthropic tool-use format — see AMP_HANDOVER.md §3.
// The LLM only ever requests these; it never touches storage directly.
export const skincareToolDefinitions: Anthropic.Tool[] = [
  {
    name: 'log_skincare_step',
    description: 'Log that a skincare routine step was completed, optionally naming the product used.',
    input_schema: {
      type: 'object',
      properties: {
        stepName: { type: 'string', description: 'e.g. "Cleanse", "Moisturize", "SPF".' },
        timeOfDay: { type: 'string', enum: ['morning', 'evening'] },
        productName: { type: 'string', description: 'Optional product used for this step.' },
      },
      required: ['stepName', 'timeOfDay'],
    },
  },
  {
    name: 'add_routine_step',
    description: 'Add a new step to the morning or evening skincare routine.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Step name, e.g. "Tone".' },
        timeOfDay: { type: 'string', enum: ['morning', 'evening'] },
      },
      required: ['name', 'timeOfDay'],
    },
  },
  {
    name: 'add_skincare_product',
    description: 'Add a product to the skincare product list, for future step logging.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Product name.' },
      },
      required: ['name'],
    },
  },
];

export const skincareToolExecutors: Record<string, ToolExecutor> = {
  log_skincare_step: async (input) => {
    const entry = await logStepDone(
      String(input.stepName),
      input.timeOfDay as TimeOfDay,
      input.productName ? String(input.productName) : undefined
    );
    return {
      summary: `Logged "${entry.stepName}"${entry.productName ? ` with ${entry.productName}` : ''} for the ${entry.timeOfDay} routine.`,
      result: entry,
    };
  },
  add_routine_step: async (input) => {
    const step = await addRoutineStep(String(input.name), input.timeOfDay as TimeOfDay);
    return { summary: `"${step.name}" added to the ${step.timeOfDay} routine.`, result: step };
  },
  add_skincare_product: async (input) => {
    const product = await addProduct(String(input.name));
    return { summary: `${product.name} added to your products.`, result: product };
  },
};
