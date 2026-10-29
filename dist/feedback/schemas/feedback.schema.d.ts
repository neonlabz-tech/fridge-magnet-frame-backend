import { Document } from 'mongoose';
export type FeedbackDocument = Feedback & Document;
export declare class Feedback {
    orderNumber?: string;
    customerName?: string;
    email?: string;
    rating: number;
    comment?: string;
}
export declare const FeedbackSchema: import("mongoose").Schema<Feedback, import("mongoose").Model<Feedback, any, any, any, any, any, Feedback>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Feedback, Document<unknown, {}, Feedback, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Feedback & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    orderNumber?: import("mongoose").SchemaDefinitionProperty<string | undefined, Feedback, Document<unknown, {}, Feedback, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Feedback & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    customerName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Feedback, Document<unknown, {}, Feedback, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Feedback & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string | undefined, Feedback, Document<unknown, {}, Feedback, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Feedback & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    rating?: import("mongoose").SchemaDefinitionProperty<number, Feedback, Document<unknown, {}, Feedback, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Feedback & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    comment?: import("mongoose").SchemaDefinitionProperty<string | undefined, Feedback, Document<unknown, {}, Feedback, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Feedback & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Feedback>;
