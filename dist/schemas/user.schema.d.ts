import { Document } from 'mongoose';
export declare class User extends Document {
    fullName?: string;
    email: string;
    password: string;
    role: string;
    isActive: boolean;
    bio?: string;
    avatar?: string;
    avatarPublicId?: string;
    twoFactorEnabled?: boolean;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    activationToken?: string;
    activationExpires?: Date;
    customerId?: string;
    phoneNumber?: string;
    customerAddress?: string;
    registrationType?: 'website' | 'manual';
    emailVerified?: boolean;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, any, any, User>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, User, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<import("mongoose").Types.ObjectId, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    fullName?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    password?: import("mongoose").SchemaDefinitionProperty<string, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    role?: import("mongoose").SchemaDefinitionProperty<string, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    bio?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    avatar?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    avatarPublicId?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    twoFactorEnabled?: import("mongoose").SchemaDefinitionProperty<boolean | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    passwordResetToken?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    passwordResetExpires?: import("mongoose").SchemaDefinitionProperty<Date | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    activationToken?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    activationExpires?: import("mongoose").SchemaDefinitionProperty<Date | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    customerId?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    phoneNumber?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    customerAddress?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    registrationType?: import("mongoose").SchemaDefinitionProperty<"website" | "manual" | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    emailVerified?: import("mongoose").SchemaDefinitionProperty<boolean | undefined, User, Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, User>;
