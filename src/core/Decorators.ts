import 'reflect-metadata';

export const INJECTABLE_METADATA_KEY = Symbol('injectable');
export const SCOPE_METADATA_KEY = Symbol('scope');
export const PROPERTIES_METADATA_KEY = Symbol('properties');
export const PARAM_TYPES_METADATA_KEY = 'design:paramtypes';

/**
 * Marks a class as injectable by the ServiceContainer.
 */
export function Injectable(): ClassDecorator {
    return (target: Function) => {
        Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target);
    };
}

/**
 * Marks a class as a singleton within the ServiceContainer.
 */
export function Singleton(): ClassDecorator {
    return (target: Function) => {
        Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target);
        Reflect.defineMetadata(SCOPE_METADATA_KEY, 'singleton', target);
    };
}

/**
 * Simple property injection decorator (Reserved for future use)
 */
export function Inject(token?: string | any): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
        const ctor = target.constructor;
        const properties = Reflect.getMetadata(PROPERTIES_METADATA_KEY, ctor) || new Map();

        // If no token is provided, try to use design:type
        const type = token || Reflect.getMetadata('design:type', target, propertyKey);

        properties.set(propertyKey, type);
        Reflect.defineMetadata(PROPERTIES_METADATA_KEY, properties, ctor);
    };
}
