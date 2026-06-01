import { WritableSignal, signal } from '@angular/core';
import { FieldTree, SchemaOrSchemaFn, form } from '@angular/forms/signals';

export function createSignalForm<TModel>(
  initialValue: TModel,
  schema?: SchemaOrSchemaFn<TModel>
): { model: WritableSignal<TModel>; fields: FieldTree<TModel> } {
  const model = signal(initialValue);
  const fields = schema ? form(model, schema) : form(model);

  return { model, fields };
}
