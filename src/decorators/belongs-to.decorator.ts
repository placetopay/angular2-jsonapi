export function BelongsTo(config: any = {}) {
  return function (target: any, propertyName: string | symbol) {
    const annotations = Reflect.getMetadata('BelongsTo', target) || [];

    annotations.push({
      propertyName,
      relationship: config.key || propertyName
    });

    Reflect.defineMetadata('BelongsTo', annotations, target);
  };
}
