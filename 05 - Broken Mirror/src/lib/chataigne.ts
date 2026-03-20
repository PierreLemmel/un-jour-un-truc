import type { Settings, SettingsRangesMap } from "./settings";
import * as THREE from 'three';

type DataType = "Float"|"String"|"Boolean"|"Color"

type ChataigneMessage<T extends string, D> = {
    type: T;
    id: number;
    data: D;
};

export type StartedMessage = ChataigneMessage<'started', StartedData>;
export type SyncMessage = ChataigneMessage<'sync', SyncData>;

type FloatStartedDataItem = {
    type: "Float";
    value: number;
    min: number;
    max: number;
};

type BooleanStartedDataItem = {
    type: "Boolean";
    value: boolean;
};

type StringStartedDataItem = {
    type: "String";
    value: string;
};

type ColorStartedDataItem = {
    type: "Color";
    value: [number, number, number, number];
};

type StartedData = {
    [K in keyof Omit<Settings, 'wsUrl'>]:
        Settings[K] extends number ? FloatStartedDataItem :
        Settings[K] extends boolean ? BooleanStartedDataItem :
        Settings[K] extends string ? StringStartedDataItem :
        Settings[K] extends THREE.Vector3 ? ColorStartedDataItem :
        never;
};

export function createStartedData(settings: Settings, rangeMap: SettingsRangesMap): StartedData {
    
    const {
        wsUrl,
        ...mappedSettings
    } = settings;

    return Object.fromEntries(Object.entries(mappedSettings).map(([key, value]) => {
        
        switch (typeof value) {
            case 'number':

                const { min, max } = rangeMap[key as keyof SettingsRangesMap];

                return [key, {
                    type: "Float",
                    value: value,
                    min: min,
                    max: max,
                }];

                case 'boolean':
                    return [key, {
                        type: "Boolean",
                        value: value,
                    }];

            case 'string':
                return [key, {
                    type: "String",
                    value: value,
                }];
                
            case 'object':
                if (value instanceof THREE.Vector3) {
                    return [key, {
                        type: "Color",
                        value: [value.x, value.y, value.z, 1],
                    }];
                }

                throw new Error(`Unsupported type: ${typeof value}`);

            default:
                throw new Error(`Unsupported type: ${typeof value}`);
        }

    })) as StartedData;
}


type SyncDataItem<T extends DataType, D> = {
    type: T;
    data: D;
}

type SyncData = {
    [K in keyof Omit<Settings, 'wsUrl'>]:
        Settings[K] extends number ? SyncDataItem<"Float", number> :
        Settings[K] extends boolean ? SyncDataItem<"Boolean", boolean> :
        Settings[K] extends string ? SyncDataItem<"String", string> :
        Settings[K] extends THREE.Vector3 ? SyncDataItem<"Color", [number, number, number, number]> :
        never;
};

export function createSyncData(settings: Settings): SyncData {
    const {
        wsUrl,
        ...mappedSettings
    } = settings;

    return Object.fromEntries(Object.entries(mappedSettings).map(([key, value]) => {
        
        switch (typeof value) {
            case 'number':
                return [key, {
                    type: "Float",
                    value: value
                }];

            case 'boolean':
                return [key, {
                    type: "Boolean",
                    value: value,
                }];

            case 'string':
                return [key, {
                    type: "String",
                    value: value,
                }];
                
            case 'object':
                if (value instanceof THREE.Vector3) {
                    return [key, {
                        type: "Color",
                        value: [value.x, value.y, value.z, 1],
                    }];
                }

                throw new Error(`Unsupported type: ${typeof value}`);

            default:
                throw new Error(`Unsupported type: ${typeof value}`);
        }

    })) as SyncData;
}

type ChataigneBaseValueChangedMessage<T extends DataType, D> = {
    type: "valueChanged";
    id: number;
    payload: {
        property: keyof Omit<Settings, 'wsUrl'>;
        value: D;
        type: T;
    }
}

export type ChataigneValueChangedMessage = ChataigneBaseValueChangedMessage<"Float", number>
    | ChataigneBaseValueChangedMessage<"Boolean", boolean>
    | ChataigneBaseValueChangedMessage<"String", string>
    | ChataigneBaseValueChangedMessage<"Color", [number, number, number, number]>;