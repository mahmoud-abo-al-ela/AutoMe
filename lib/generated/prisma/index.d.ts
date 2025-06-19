
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Car
 * 
 */
export type Car = $Result.DefaultSelection<Prisma.$CarPayload>
/**
 * Model Dealership
 * 
 */
export type Dealership = $Result.DefaultSelection<Prisma.$DealershipPayload>
/**
 * Model WorkingHours
 * 
 */
export type WorkingHours = $Result.DefaultSelection<Prisma.$WorkingHoursPayload>
/**
 * Model SavedCar
 * 
 */
export type SavedCar = $Result.DefaultSelection<Prisma.$SavedCarPayload>
/**
 * Model TestDrive
 * 
 */
export type TestDrive = $Result.DefaultSelection<Prisma.$TestDrivePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const UserRole: {
  USER: 'USER',
  ADMIN: 'ADMIN'
};

export type UserRole = (typeof UserRole)[keyof typeof UserRole]


export const CarStatus: {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  SOLD: 'SOLD'
};

export type CarStatus = (typeof CarStatus)[keyof typeof CarStatus]


export const DayOfWeek: {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY'
};

export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek]


export const TestDriveStatus: {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED'
};

export type TestDriveStatus = (typeof TestDriveStatus)[keyof typeof TestDriveStatus]

}

export type UserRole = $Enums.UserRole

export const UserRole: typeof $Enums.UserRole

export type CarStatus = $Enums.CarStatus

export const CarStatus: typeof $Enums.CarStatus

export type DayOfWeek = $Enums.DayOfWeek

export const DayOfWeek: typeof $Enums.DayOfWeek

export type TestDriveStatus = $Enums.TestDriveStatus

export const TestDriveStatus: typeof $Enums.TestDriveStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.car`: Exposes CRUD operations for the **Car** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Cars
    * const cars = await prisma.car.findMany()
    * ```
    */
  get car(): Prisma.CarDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.dealership`: Exposes CRUD operations for the **Dealership** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Dealerships
    * const dealerships = await prisma.dealership.findMany()
    * ```
    */
  get dealership(): Prisma.DealershipDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.workingHours`: Exposes CRUD operations for the **WorkingHours** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorkingHours
    * const workingHours = await prisma.workingHours.findMany()
    * ```
    */
  get workingHours(): Prisma.WorkingHoursDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.savedCar`: Exposes CRUD operations for the **SavedCar** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SavedCars
    * const savedCars = await prisma.savedCar.findMany()
    * ```
    */
  get savedCar(): Prisma.SavedCarDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.testDrive`: Exposes CRUD operations for the **TestDrive** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TestDrives
    * const testDrives = await prisma.testDrive.findMany()
    * ```
    */
  get testDrive(): Prisma.TestDriveDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.8.2
   * Query Engine version: 2060c79ba17c6bb9f5823312b6f6b7f4a845738e
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Car: 'Car',
    Dealership: 'Dealership',
    WorkingHours: 'WorkingHours',
    SavedCar: 'SavedCar',
    TestDrive: 'TestDrive'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "car" | "dealership" | "workingHours" | "savedCar" | "testDrive"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Car: {
        payload: Prisma.$CarPayload<ExtArgs>
        fields: Prisma.CarFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CarFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CarPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CarFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CarPayload>
          }
          findFirst: {
            args: Prisma.CarFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CarPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CarFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CarPayload>
          }
          findMany: {
            args: Prisma.CarFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CarPayload>[]
          }
          create: {
            args: Prisma.CarCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CarPayload>
          }
          createMany: {
            args: Prisma.CarCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CarCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CarPayload>[]
          }
          delete: {
            args: Prisma.CarDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CarPayload>
          }
          update: {
            args: Prisma.CarUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CarPayload>
          }
          deleteMany: {
            args: Prisma.CarDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CarUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CarUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CarPayload>[]
          }
          upsert: {
            args: Prisma.CarUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CarPayload>
          }
          aggregate: {
            args: Prisma.CarAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCar>
          }
          groupBy: {
            args: Prisma.CarGroupByArgs<ExtArgs>
            result: $Utils.Optional<CarGroupByOutputType>[]
          }
          count: {
            args: Prisma.CarCountArgs<ExtArgs>
            result: $Utils.Optional<CarCountAggregateOutputType> | number
          }
        }
      }
      Dealership: {
        payload: Prisma.$DealershipPayload<ExtArgs>
        fields: Prisma.DealershipFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DealershipFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DealershipPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DealershipFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DealershipPayload>
          }
          findFirst: {
            args: Prisma.DealershipFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DealershipPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DealershipFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DealershipPayload>
          }
          findMany: {
            args: Prisma.DealershipFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DealershipPayload>[]
          }
          create: {
            args: Prisma.DealershipCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DealershipPayload>
          }
          createMany: {
            args: Prisma.DealershipCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DealershipCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DealershipPayload>[]
          }
          delete: {
            args: Prisma.DealershipDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DealershipPayload>
          }
          update: {
            args: Prisma.DealershipUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DealershipPayload>
          }
          deleteMany: {
            args: Prisma.DealershipDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DealershipUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DealershipUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DealershipPayload>[]
          }
          upsert: {
            args: Prisma.DealershipUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DealershipPayload>
          }
          aggregate: {
            args: Prisma.DealershipAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDealership>
          }
          groupBy: {
            args: Prisma.DealershipGroupByArgs<ExtArgs>
            result: $Utils.Optional<DealershipGroupByOutputType>[]
          }
          count: {
            args: Prisma.DealershipCountArgs<ExtArgs>
            result: $Utils.Optional<DealershipCountAggregateOutputType> | number
          }
        }
      }
      WorkingHours: {
        payload: Prisma.$WorkingHoursPayload<ExtArgs>
        fields: Prisma.WorkingHoursFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorkingHoursFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkingHoursPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorkingHoursFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkingHoursPayload>
          }
          findFirst: {
            args: Prisma.WorkingHoursFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkingHoursPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorkingHoursFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkingHoursPayload>
          }
          findMany: {
            args: Prisma.WorkingHoursFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkingHoursPayload>[]
          }
          create: {
            args: Prisma.WorkingHoursCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkingHoursPayload>
          }
          createMany: {
            args: Prisma.WorkingHoursCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorkingHoursCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkingHoursPayload>[]
          }
          delete: {
            args: Prisma.WorkingHoursDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkingHoursPayload>
          }
          update: {
            args: Prisma.WorkingHoursUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkingHoursPayload>
          }
          deleteMany: {
            args: Prisma.WorkingHoursDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorkingHoursUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WorkingHoursUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkingHoursPayload>[]
          }
          upsert: {
            args: Prisma.WorkingHoursUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkingHoursPayload>
          }
          aggregate: {
            args: Prisma.WorkingHoursAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkingHours>
          }
          groupBy: {
            args: Prisma.WorkingHoursGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkingHoursGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorkingHoursCountArgs<ExtArgs>
            result: $Utils.Optional<WorkingHoursCountAggregateOutputType> | number
          }
        }
      }
      SavedCar: {
        payload: Prisma.$SavedCarPayload<ExtArgs>
        fields: Prisma.SavedCarFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SavedCarFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SavedCarPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SavedCarFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SavedCarPayload>
          }
          findFirst: {
            args: Prisma.SavedCarFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SavedCarPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SavedCarFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SavedCarPayload>
          }
          findMany: {
            args: Prisma.SavedCarFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SavedCarPayload>[]
          }
          create: {
            args: Prisma.SavedCarCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SavedCarPayload>
          }
          createMany: {
            args: Prisma.SavedCarCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SavedCarCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SavedCarPayload>[]
          }
          delete: {
            args: Prisma.SavedCarDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SavedCarPayload>
          }
          update: {
            args: Prisma.SavedCarUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SavedCarPayload>
          }
          deleteMany: {
            args: Prisma.SavedCarDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SavedCarUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SavedCarUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SavedCarPayload>[]
          }
          upsert: {
            args: Prisma.SavedCarUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SavedCarPayload>
          }
          aggregate: {
            args: Prisma.SavedCarAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSavedCar>
          }
          groupBy: {
            args: Prisma.SavedCarGroupByArgs<ExtArgs>
            result: $Utils.Optional<SavedCarGroupByOutputType>[]
          }
          count: {
            args: Prisma.SavedCarCountArgs<ExtArgs>
            result: $Utils.Optional<SavedCarCountAggregateOutputType> | number
          }
        }
      }
      TestDrive: {
        payload: Prisma.$TestDrivePayload<ExtArgs>
        fields: Prisma.TestDriveFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TestDriveFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestDrivePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TestDriveFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestDrivePayload>
          }
          findFirst: {
            args: Prisma.TestDriveFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestDrivePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TestDriveFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestDrivePayload>
          }
          findMany: {
            args: Prisma.TestDriveFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestDrivePayload>[]
          }
          create: {
            args: Prisma.TestDriveCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestDrivePayload>
          }
          createMany: {
            args: Prisma.TestDriveCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TestDriveCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestDrivePayload>[]
          }
          delete: {
            args: Prisma.TestDriveDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestDrivePayload>
          }
          update: {
            args: Prisma.TestDriveUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestDrivePayload>
          }
          deleteMany: {
            args: Prisma.TestDriveDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TestDriveUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TestDriveUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestDrivePayload>[]
          }
          upsert: {
            args: Prisma.TestDriveUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestDrivePayload>
          }
          aggregate: {
            args: Prisma.TestDriveAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTestDrive>
          }
          groupBy: {
            args: Prisma.TestDriveGroupByArgs<ExtArgs>
            result: $Utils.Optional<TestDriveGroupByOutputType>[]
          }
          count: {
            args: Prisma.TestDriveCountArgs<ExtArgs>
            result: $Utils.Optional<TestDriveCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    car?: CarOmit
    dealership?: DealershipOmit
    workingHours?: WorkingHoursOmit
    savedCar?: SavedCarOmit
    testDrive?: TestDriveOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    savedCars: number
    testDrives: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    savedCars?: boolean | UserCountOutputTypeCountSavedCarsArgs
    testDrives?: boolean | UserCountOutputTypeCountTestDrivesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSavedCarsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SavedCarWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountTestDrivesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestDriveWhereInput
  }


  /**
   * Count Type CarCountOutputType
   */

  export type CarCountOutputType = {
    savedBy: number
    testDrive: number
  }

  export type CarCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    savedBy?: boolean | CarCountOutputTypeCountSavedByArgs
    testDrive?: boolean | CarCountOutputTypeCountTestDriveArgs
  }

  // Custom InputTypes
  /**
   * CarCountOutputType without action
   */
  export type CarCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CarCountOutputType
     */
    select?: CarCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CarCountOutputType without action
   */
  export type CarCountOutputTypeCountSavedByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SavedCarWhereInput
  }

  /**
   * CarCountOutputType without action
   */
  export type CarCountOutputTypeCountTestDriveArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestDriveWhereInput
  }


  /**
   * Count Type DealershipCountOutputType
   */

  export type DealershipCountOutputType = {
    workingHours: number
  }

  export type DealershipCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workingHours?: boolean | DealershipCountOutputTypeCountWorkingHoursArgs
  }

  // Custom InputTypes
  /**
   * DealershipCountOutputType without action
   */
  export type DealershipCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DealershipCountOutputType
     */
    select?: DealershipCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DealershipCountOutputType without action
   */
  export type DealershipCountOutputTypeCountWorkingHoursArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkingHoursWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    clerkId: string | null
    email: string | null
    name: string | null
    imageUrl: string | null
    phone: string | null
    createdAt: Date | null
    updatedAt: Date | null
    role: $Enums.UserRole | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    clerkId: string | null
    email: string | null
    name: string | null
    imageUrl: string | null
    phone: string | null
    createdAt: Date | null
    updatedAt: Date | null
    role: $Enums.UserRole | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    clerkId: number
    email: number
    name: number
    imageUrl: number
    phone: number
    createdAt: number
    updatedAt: number
    role: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    clerkId?: true
    email?: true
    name?: true
    imageUrl?: true
    phone?: true
    createdAt?: true
    updatedAt?: true
    role?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    clerkId?: true
    email?: true
    name?: true
    imageUrl?: true
    phone?: true
    createdAt?: true
    updatedAt?: true
    role?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    clerkId?: true
    email?: true
    name?: true
    imageUrl?: true
    phone?: true
    createdAt?: true
    updatedAt?: true
    role?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    clerkId: string
    email: string
    name: string | null
    imageUrl: string | null
    phone: string | null
    createdAt: Date
    updatedAt: Date
    role: $Enums.UserRole
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clerkId?: boolean
    email?: boolean
    name?: boolean
    imageUrl?: boolean
    phone?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    role?: boolean
    savedCars?: boolean | User$savedCarsArgs<ExtArgs>
    testDrives?: boolean | User$testDrivesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clerkId?: boolean
    email?: boolean
    name?: boolean
    imageUrl?: boolean
    phone?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    role?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clerkId?: boolean
    email?: boolean
    name?: boolean
    imageUrl?: boolean
    phone?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    role?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    clerkId?: boolean
    email?: boolean
    name?: boolean
    imageUrl?: boolean
    phone?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    role?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "clerkId" | "email" | "name" | "imageUrl" | "phone" | "createdAt" | "updatedAt" | "role", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    savedCars?: boolean | User$savedCarsArgs<ExtArgs>
    testDrives?: boolean | User$testDrivesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      savedCars: Prisma.$SavedCarPayload<ExtArgs>[]
      testDrives: Prisma.$TestDrivePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      clerkId: string
      email: string
      name: string | null
      imageUrl: string | null
      phone: string | null
      createdAt: Date
      updatedAt: Date
      role: $Enums.UserRole
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    savedCars<T extends User$savedCarsArgs<ExtArgs> = {}>(args?: Subset<T, User$savedCarsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    testDrives<T extends User$testDrivesArgs<ExtArgs> = {}>(args?: Subset<T, User$testDrivesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly clerkId: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly imageUrl: FieldRef<"User", 'String'>
    readonly phone: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly role: FieldRef<"User", 'UserRole'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.savedCars
   */
  export type User$savedCarsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
    where?: SavedCarWhereInput
    orderBy?: SavedCarOrderByWithRelationInput | SavedCarOrderByWithRelationInput[]
    cursor?: SavedCarWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SavedCarScalarFieldEnum | SavedCarScalarFieldEnum[]
  }

  /**
   * User.testDrives
   */
  export type User$testDrivesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
    where?: TestDriveWhereInput
    orderBy?: TestDriveOrderByWithRelationInput | TestDriveOrderByWithRelationInput[]
    cursor?: TestDriveWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TestDriveScalarFieldEnum | TestDriveScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Car
   */

  export type AggregateCar = {
    _count: CarCountAggregateOutputType | null
    _avg: CarAvgAggregateOutputType | null
    _sum: CarSumAggregateOutputType | null
    _min: CarMinAggregateOutputType | null
    _max: CarMaxAggregateOutputType | null
  }

  export type CarAvgAggregateOutputType = {
    year: number | null
    price: Decimal | null
    mileage: number | null
    seats: number | null
  }

  export type CarSumAggregateOutputType = {
    year: number | null
    price: Decimal | null
    mileage: number | null
    seats: number | null
  }

  export type CarMinAggregateOutputType = {
    id: string | null
    make: string | null
    model: string | null
    year: number | null
    price: Decimal | null
    mileage: number | null
    fuelType: string | null
    transmission: string | null
    color: string | null
    seats: number | null
    bodyType: string | null
    featured: boolean | null
    status: $Enums.CarStatus | null
    createdAt: Date | null
    updatedAt: Date | null
    title: string | null
    description: string | null
    location: string | null
  }

  export type CarMaxAggregateOutputType = {
    id: string | null
    make: string | null
    model: string | null
    year: number | null
    price: Decimal | null
    mileage: number | null
    fuelType: string | null
    transmission: string | null
    color: string | null
    seats: number | null
    bodyType: string | null
    featured: boolean | null
    status: $Enums.CarStatus | null
    createdAt: Date | null
    updatedAt: Date | null
    title: string | null
    description: string | null
    location: string | null
  }

  export type CarCountAggregateOutputType = {
    id: number
    make: number
    model: number
    year: number
    price: number
    mileage: number
    fuelType: number
    transmission: number
    color: number
    seats: number
    bodyType: number
    featured: number
    status: number
    images: number
    createdAt: number
    updatedAt: number
    title: number
    description: number
    location: number
    features: number
    _all: number
  }


  export type CarAvgAggregateInputType = {
    year?: true
    price?: true
    mileage?: true
    seats?: true
  }

  export type CarSumAggregateInputType = {
    year?: true
    price?: true
    mileage?: true
    seats?: true
  }

  export type CarMinAggregateInputType = {
    id?: true
    make?: true
    model?: true
    year?: true
    price?: true
    mileage?: true
    fuelType?: true
    transmission?: true
    color?: true
    seats?: true
    bodyType?: true
    featured?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    title?: true
    description?: true
    location?: true
  }

  export type CarMaxAggregateInputType = {
    id?: true
    make?: true
    model?: true
    year?: true
    price?: true
    mileage?: true
    fuelType?: true
    transmission?: true
    color?: true
    seats?: true
    bodyType?: true
    featured?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    title?: true
    description?: true
    location?: true
  }

  export type CarCountAggregateInputType = {
    id?: true
    make?: true
    model?: true
    year?: true
    price?: true
    mileage?: true
    fuelType?: true
    transmission?: true
    color?: true
    seats?: true
    bodyType?: true
    featured?: true
    status?: true
    images?: true
    createdAt?: true
    updatedAt?: true
    title?: true
    description?: true
    location?: true
    features?: true
    _all?: true
  }

  export type CarAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Car to aggregate.
     */
    where?: CarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cars to fetch.
     */
    orderBy?: CarOrderByWithRelationInput | CarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Cars
    **/
    _count?: true | CarCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CarAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CarSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CarMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CarMaxAggregateInputType
  }

  export type GetCarAggregateType<T extends CarAggregateArgs> = {
        [P in keyof T & keyof AggregateCar]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCar[P]>
      : GetScalarType<T[P], AggregateCar[P]>
  }




  export type CarGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CarWhereInput
    orderBy?: CarOrderByWithAggregationInput | CarOrderByWithAggregationInput[]
    by: CarScalarFieldEnum[] | CarScalarFieldEnum
    having?: CarScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CarCountAggregateInputType | true
    _avg?: CarAvgAggregateInputType
    _sum?: CarSumAggregateInputType
    _min?: CarMinAggregateInputType
    _max?: CarMaxAggregateInputType
  }

  export type CarGroupByOutputType = {
    id: string
    make: string
    model: string
    year: number
    price: Decimal
    mileage: number
    fuelType: string
    transmission: string
    color: string
    seats: number | null
    bodyType: string
    featured: boolean
    status: $Enums.CarStatus
    images: string[]
    createdAt: Date
    updatedAt: Date
    title: string | null
    description: string | null
    location: string | null
    features: string[]
    _count: CarCountAggregateOutputType | null
    _avg: CarAvgAggregateOutputType | null
    _sum: CarSumAggregateOutputType | null
    _min: CarMinAggregateOutputType | null
    _max: CarMaxAggregateOutputType | null
  }

  type GetCarGroupByPayload<T extends CarGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CarGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CarGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CarGroupByOutputType[P]>
            : GetScalarType<T[P], CarGroupByOutputType[P]>
        }
      >
    >


  export type CarSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    make?: boolean
    model?: boolean
    year?: boolean
    price?: boolean
    mileage?: boolean
    fuelType?: boolean
    transmission?: boolean
    color?: boolean
    seats?: boolean
    bodyType?: boolean
    featured?: boolean
    status?: boolean
    images?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    title?: boolean
    description?: boolean
    location?: boolean
    features?: boolean
    savedBy?: boolean | Car$savedByArgs<ExtArgs>
    testDrive?: boolean | Car$testDriveArgs<ExtArgs>
    _count?: boolean | CarCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["car"]>

  export type CarSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    make?: boolean
    model?: boolean
    year?: boolean
    price?: boolean
    mileage?: boolean
    fuelType?: boolean
    transmission?: boolean
    color?: boolean
    seats?: boolean
    bodyType?: boolean
    featured?: boolean
    status?: boolean
    images?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    title?: boolean
    description?: boolean
    location?: boolean
    features?: boolean
  }, ExtArgs["result"]["car"]>

  export type CarSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    make?: boolean
    model?: boolean
    year?: boolean
    price?: boolean
    mileage?: boolean
    fuelType?: boolean
    transmission?: boolean
    color?: boolean
    seats?: boolean
    bodyType?: boolean
    featured?: boolean
    status?: boolean
    images?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    title?: boolean
    description?: boolean
    location?: boolean
    features?: boolean
  }, ExtArgs["result"]["car"]>

  export type CarSelectScalar = {
    id?: boolean
    make?: boolean
    model?: boolean
    year?: boolean
    price?: boolean
    mileage?: boolean
    fuelType?: boolean
    transmission?: boolean
    color?: boolean
    seats?: boolean
    bodyType?: boolean
    featured?: boolean
    status?: boolean
    images?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    title?: boolean
    description?: boolean
    location?: boolean
    features?: boolean
  }

  export type CarOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "make" | "model" | "year" | "price" | "mileage" | "fuelType" | "transmission" | "color" | "seats" | "bodyType" | "featured" | "status" | "images" | "createdAt" | "updatedAt" | "title" | "description" | "location" | "features", ExtArgs["result"]["car"]>
  export type CarInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    savedBy?: boolean | Car$savedByArgs<ExtArgs>
    testDrive?: boolean | Car$testDriveArgs<ExtArgs>
    _count?: boolean | CarCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CarIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CarIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CarPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Car"
    objects: {
      savedBy: Prisma.$SavedCarPayload<ExtArgs>[]
      testDrive: Prisma.$TestDrivePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      make: string
      model: string
      year: number
      price: Prisma.Decimal
      mileage: number
      fuelType: string
      transmission: string
      color: string
      seats: number | null
      bodyType: string
      featured: boolean
      status: $Enums.CarStatus
      images: string[]
      createdAt: Date
      updatedAt: Date
      title: string | null
      description: string | null
      location: string | null
      features: string[]
    }, ExtArgs["result"]["car"]>
    composites: {}
  }

  type CarGetPayload<S extends boolean | null | undefined | CarDefaultArgs> = $Result.GetResult<Prisma.$CarPayload, S>

  type CarCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CarFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CarCountAggregateInputType | true
    }

  export interface CarDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Car'], meta: { name: 'Car' } }
    /**
     * Find zero or one Car that matches the filter.
     * @param {CarFindUniqueArgs} args - Arguments to find a Car
     * @example
     * // Get one Car
     * const car = await prisma.car.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CarFindUniqueArgs>(args: SelectSubset<T, CarFindUniqueArgs<ExtArgs>>): Prisma__CarClient<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Car that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CarFindUniqueOrThrowArgs} args - Arguments to find a Car
     * @example
     * // Get one Car
     * const car = await prisma.car.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CarFindUniqueOrThrowArgs>(args: SelectSubset<T, CarFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CarClient<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Car that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CarFindFirstArgs} args - Arguments to find a Car
     * @example
     * // Get one Car
     * const car = await prisma.car.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CarFindFirstArgs>(args?: SelectSubset<T, CarFindFirstArgs<ExtArgs>>): Prisma__CarClient<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Car that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CarFindFirstOrThrowArgs} args - Arguments to find a Car
     * @example
     * // Get one Car
     * const car = await prisma.car.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CarFindFirstOrThrowArgs>(args?: SelectSubset<T, CarFindFirstOrThrowArgs<ExtArgs>>): Prisma__CarClient<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Cars that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CarFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Cars
     * const cars = await prisma.car.findMany()
     * 
     * // Get first 10 Cars
     * const cars = await prisma.car.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const carWithIdOnly = await prisma.car.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CarFindManyArgs>(args?: SelectSubset<T, CarFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Car.
     * @param {CarCreateArgs} args - Arguments to create a Car.
     * @example
     * // Create one Car
     * const Car = await prisma.car.create({
     *   data: {
     *     // ... data to create a Car
     *   }
     * })
     * 
     */
    create<T extends CarCreateArgs>(args: SelectSubset<T, CarCreateArgs<ExtArgs>>): Prisma__CarClient<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Cars.
     * @param {CarCreateManyArgs} args - Arguments to create many Cars.
     * @example
     * // Create many Cars
     * const car = await prisma.car.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CarCreateManyArgs>(args?: SelectSubset<T, CarCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Cars and returns the data saved in the database.
     * @param {CarCreateManyAndReturnArgs} args - Arguments to create many Cars.
     * @example
     * // Create many Cars
     * const car = await prisma.car.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Cars and only return the `id`
     * const carWithIdOnly = await prisma.car.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CarCreateManyAndReturnArgs>(args?: SelectSubset<T, CarCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Car.
     * @param {CarDeleteArgs} args - Arguments to delete one Car.
     * @example
     * // Delete one Car
     * const Car = await prisma.car.delete({
     *   where: {
     *     // ... filter to delete one Car
     *   }
     * })
     * 
     */
    delete<T extends CarDeleteArgs>(args: SelectSubset<T, CarDeleteArgs<ExtArgs>>): Prisma__CarClient<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Car.
     * @param {CarUpdateArgs} args - Arguments to update one Car.
     * @example
     * // Update one Car
     * const car = await prisma.car.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CarUpdateArgs>(args: SelectSubset<T, CarUpdateArgs<ExtArgs>>): Prisma__CarClient<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Cars.
     * @param {CarDeleteManyArgs} args - Arguments to filter Cars to delete.
     * @example
     * // Delete a few Cars
     * const { count } = await prisma.car.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CarDeleteManyArgs>(args?: SelectSubset<T, CarDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Cars.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CarUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Cars
     * const car = await prisma.car.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CarUpdateManyArgs>(args: SelectSubset<T, CarUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Cars and returns the data updated in the database.
     * @param {CarUpdateManyAndReturnArgs} args - Arguments to update many Cars.
     * @example
     * // Update many Cars
     * const car = await prisma.car.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Cars and only return the `id`
     * const carWithIdOnly = await prisma.car.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CarUpdateManyAndReturnArgs>(args: SelectSubset<T, CarUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Car.
     * @param {CarUpsertArgs} args - Arguments to update or create a Car.
     * @example
     * // Update or create a Car
     * const car = await prisma.car.upsert({
     *   create: {
     *     // ... data to create a Car
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Car we want to update
     *   }
     * })
     */
    upsert<T extends CarUpsertArgs>(args: SelectSubset<T, CarUpsertArgs<ExtArgs>>): Prisma__CarClient<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Cars.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CarCountArgs} args - Arguments to filter Cars to count.
     * @example
     * // Count the number of Cars
     * const count = await prisma.car.count({
     *   where: {
     *     // ... the filter for the Cars we want to count
     *   }
     * })
    **/
    count<T extends CarCountArgs>(
      args?: Subset<T, CarCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CarCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Car.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CarAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CarAggregateArgs>(args: Subset<T, CarAggregateArgs>): Prisma.PrismaPromise<GetCarAggregateType<T>>

    /**
     * Group by Car.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CarGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CarGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CarGroupByArgs['orderBy'] }
        : { orderBy?: CarGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CarGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCarGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Car model
   */
  readonly fields: CarFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Car.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CarClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    savedBy<T extends Car$savedByArgs<ExtArgs> = {}>(args?: Subset<T, Car$savedByArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    testDrive<T extends Car$testDriveArgs<ExtArgs> = {}>(args?: Subset<T, Car$testDriveArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Car model
   */
  interface CarFieldRefs {
    readonly id: FieldRef<"Car", 'String'>
    readonly make: FieldRef<"Car", 'String'>
    readonly model: FieldRef<"Car", 'String'>
    readonly year: FieldRef<"Car", 'Int'>
    readonly price: FieldRef<"Car", 'Decimal'>
    readonly mileage: FieldRef<"Car", 'Int'>
    readonly fuelType: FieldRef<"Car", 'String'>
    readonly transmission: FieldRef<"Car", 'String'>
    readonly color: FieldRef<"Car", 'String'>
    readonly seats: FieldRef<"Car", 'Int'>
    readonly bodyType: FieldRef<"Car", 'String'>
    readonly featured: FieldRef<"Car", 'Boolean'>
    readonly status: FieldRef<"Car", 'CarStatus'>
    readonly images: FieldRef<"Car", 'String[]'>
    readonly createdAt: FieldRef<"Car", 'DateTime'>
    readonly updatedAt: FieldRef<"Car", 'DateTime'>
    readonly title: FieldRef<"Car", 'String'>
    readonly description: FieldRef<"Car", 'String'>
    readonly location: FieldRef<"Car", 'String'>
    readonly features: FieldRef<"Car", 'String[]'>
  }
    

  // Custom InputTypes
  /**
   * Car findUnique
   */
  export type CarFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CarInclude<ExtArgs> | null
    /**
     * Filter, which Car to fetch.
     */
    where: CarWhereUniqueInput
  }

  /**
   * Car findUniqueOrThrow
   */
  export type CarFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CarInclude<ExtArgs> | null
    /**
     * Filter, which Car to fetch.
     */
    where: CarWhereUniqueInput
  }

  /**
   * Car findFirst
   */
  export type CarFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CarInclude<ExtArgs> | null
    /**
     * Filter, which Car to fetch.
     */
    where?: CarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cars to fetch.
     */
    orderBy?: CarOrderByWithRelationInput | CarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Cars.
     */
    cursor?: CarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Cars.
     */
    distinct?: CarScalarFieldEnum | CarScalarFieldEnum[]
  }

  /**
   * Car findFirstOrThrow
   */
  export type CarFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CarInclude<ExtArgs> | null
    /**
     * Filter, which Car to fetch.
     */
    where?: CarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cars to fetch.
     */
    orderBy?: CarOrderByWithRelationInput | CarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Cars.
     */
    cursor?: CarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Cars.
     */
    distinct?: CarScalarFieldEnum | CarScalarFieldEnum[]
  }

  /**
   * Car findMany
   */
  export type CarFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CarInclude<ExtArgs> | null
    /**
     * Filter, which Cars to fetch.
     */
    where?: CarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cars to fetch.
     */
    orderBy?: CarOrderByWithRelationInput | CarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Cars.
     */
    cursor?: CarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cars.
     */
    skip?: number
    distinct?: CarScalarFieldEnum | CarScalarFieldEnum[]
  }

  /**
   * Car create
   */
  export type CarCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CarInclude<ExtArgs> | null
    /**
     * The data needed to create a Car.
     */
    data: XOR<CarCreateInput, CarUncheckedCreateInput>
  }

  /**
   * Car createMany
   */
  export type CarCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Cars.
     */
    data: CarCreateManyInput | CarCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Car createManyAndReturn
   */
  export type CarCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * The data used to create many Cars.
     */
    data: CarCreateManyInput | CarCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Car update
   */
  export type CarUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CarInclude<ExtArgs> | null
    /**
     * The data needed to update a Car.
     */
    data: XOR<CarUpdateInput, CarUncheckedUpdateInput>
    /**
     * Choose, which Car to update.
     */
    where: CarWhereUniqueInput
  }

  /**
   * Car updateMany
   */
  export type CarUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Cars.
     */
    data: XOR<CarUpdateManyMutationInput, CarUncheckedUpdateManyInput>
    /**
     * Filter which Cars to update
     */
    where?: CarWhereInput
    /**
     * Limit how many Cars to update.
     */
    limit?: number
  }

  /**
   * Car updateManyAndReturn
   */
  export type CarUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * The data used to update Cars.
     */
    data: XOR<CarUpdateManyMutationInput, CarUncheckedUpdateManyInput>
    /**
     * Filter which Cars to update
     */
    where?: CarWhereInput
    /**
     * Limit how many Cars to update.
     */
    limit?: number
  }

  /**
   * Car upsert
   */
  export type CarUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CarInclude<ExtArgs> | null
    /**
     * The filter to search for the Car to update in case it exists.
     */
    where: CarWhereUniqueInput
    /**
     * In case the Car found by the `where` argument doesn't exist, create a new Car with this data.
     */
    create: XOR<CarCreateInput, CarUncheckedCreateInput>
    /**
     * In case the Car was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CarUpdateInput, CarUncheckedUpdateInput>
  }

  /**
   * Car delete
   */
  export type CarDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CarInclude<ExtArgs> | null
    /**
     * Filter which Car to delete.
     */
    where: CarWhereUniqueInput
  }

  /**
   * Car deleteMany
   */
  export type CarDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Cars to delete
     */
    where?: CarWhereInput
    /**
     * Limit how many Cars to delete.
     */
    limit?: number
  }

  /**
   * Car.savedBy
   */
  export type Car$savedByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
    where?: SavedCarWhereInput
    orderBy?: SavedCarOrderByWithRelationInput | SavedCarOrderByWithRelationInput[]
    cursor?: SavedCarWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SavedCarScalarFieldEnum | SavedCarScalarFieldEnum[]
  }

  /**
   * Car.testDrive
   */
  export type Car$testDriveArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
    where?: TestDriveWhereInput
    orderBy?: TestDriveOrderByWithRelationInput | TestDriveOrderByWithRelationInput[]
    cursor?: TestDriveWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TestDriveScalarFieldEnum | TestDriveScalarFieldEnum[]
  }

  /**
   * Car without action
   */
  export type CarDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Car
     */
    select?: CarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Car
     */
    omit?: CarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CarInclude<ExtArgs> | null
  }


  /**
   * Model Dealership
   */

  export type AggregateDealership = {
    _count: DealershipCountAggregateOutputType | null
    _min: DealershipMinAggregateOutputType | null
    _max: DealershipMaxAggregateOutputType | null
  }

  export type DealershipMinAggregateOutputType = {
    id: string | null
    name: string | null
    address: string | null
    phone: string | null
    email: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DealershipMaxAggregateOutputType = {
    id: string | null
    name: string | null
    address: string | null
    phone: string | null
    email: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DealershipCountAggregateOutputType = {
    id: number
    name: number
    address: number
    phone: number
    email: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type DealershipMinAggregateInputType = {
    id?: true
    name?: true
    address?: true
    phone?: true
    email?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DealershipMaxAggregateInputType = {
    id?: true
    name?: true
    address?: true
    phone?: true
    email?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DealershipCountAggregateInputType = {
    id?: true
    name?: true
    address?: true
    phone?: true
    email?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type DealershipAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Dealership to aggregate.
     */
    where?: DealershipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dealerships to fetch.
     */
    orderBy?: DealershipOrderByWithRelationInput | DealershipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DealershipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dealerships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dealerships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Dealerships
    **/
    _count?: true | DealershipCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DealershipMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DealershipMaxAggregateInputType
  }

  export type GetDealershipAggregateType<T extends DealershipAggregateArgs> = {
        [P in keyof T & keyof AggregateDealership]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDealership[P]>
      : GetScalarType<T[P], AggregateDealership[P]>
  }




  export type DealershipGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DealershipWhereInput
    orderBy?: DealershipOrderByWithAggregationInput | DealershipOrderByWithAggregationInput[]
    by: DealershipScalarFieldEnum[] | DealershipScalarFieldEnum
    having?: DealershipScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DealershipCountAggregateInputType | true
    _min?: DealershipMinAggregateInputType
    _max?: DealershipMaxAggregateInputType
  }

  export type DealershipGroupByOutputType = {
    id: string
    name: string
    address: string
    phone: string
    email: string
    createdAt: Date
    updatedAt: Date
    _count: DealershipCountAggregateOutputType | null
    _min: DealershipMinAggregateOutputType | null
    _max: DealershipMaxAggregateOutputType | null
  }

  type GetDealershipGroupByPayload<T extends DealershipGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DealershipGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DealershipGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DealershipGroupByOutputType[P]>
            : GetScalarType<T[P], DealershipGroupByOutputType[P]>
        }
      >
    >


  export type DealershipSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    address?: boolean
    phone?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    workingHours?: boolean | Dealership$workingHoursArgs<ExtArgs>
    _count?: boolean | DealershipCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["dealership"]>

  export type DealershipSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    address?: boolean
    phone?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["dealership"]>

  export type DealershipSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    address?: boolean
    phone?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["dealership"]>

  export type DealershipSelectScalar = {
    id?: boolean
    name?: boolean
    address?: boolean
    phone?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type DealershipOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "address" | "phone" | "email" | "createdAt" | "updatedAt", ExtArgs["result"]["dealership"]>
  export type DealershipInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workingHours?: boolean | Dealership$workingHoursArgs<ExtArgs>
    _count?: boolean | DealershipCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DealershipIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type DealershipIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $DealershipPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Dealership"
    objects: {
      workingHours: Prisma.$WorkingHoursPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      address: string
      phone: string
      email: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["dealership"]>
    composites: {}
  }

  type DealershipGetPayload<S extends boolean | null | undefined | DealershipDefaultArgs> = $Result.GetResult<Prisma.$DealershipPayload, S>

  type DealershipCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DealershipFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DealershipCountAggregateInputType | true
    }

  export interface DealershipDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Dealership'], meta: { name: 'Dealership' } }
    /**
     * Find zero or one Dealership that matches the filter.
     * @param {DealershipFindUniqueArgs} args - Arguments to find a Dealership
     * @example
     * // Get one Dealership
     * const dealership = await prisma.dealership.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DealershipFindUniqueArgs>(args: SelectSubset<T, DealershipFindUniqueArgs<ExtArgs>>): Prisma__DealershipClient<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Dealership that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DealershipFindUniqueOrThrowArgs} args - Arguments to find a Dealership
     * @example
     * // Get one Dealership
     * const dealership = await prisma.dealership.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DealershipFindUniqueOrThrowArgs>(args: SelectSubset<T, DealershipFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DealershipClient<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Dealership that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DealershipFindFirstArgs} args - Arguments to find a Dealership
     * @example
     * // Get one Dealership
     * const dealership = await prisma.dealership.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DealershipFindFirstArgs>(args?: SelectSubset<T, DealershipFindFirstArgs<ExtArgs>>): Prisma__DealershipClient<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Dealership that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DealershipFindFirstOrThrowArgs} args - Arguments to find a Dealership
     * @example
     * // Get one Dealership
     * const dealership = await prisma.dealership.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DealershipFindFirstOrThrowArgs>(args?: SelectSubset<T, DealershipFindFirstOrThrowArgs<ExtArgs>>): Prisma__DealershipClient<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Dealerships that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DealershipFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Dealerships
     * const dealerships = await prisma.dealership.findMany()
     * 
     * // Get first 10 Dealerships
     * const dealerships = await prisma.dealership.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const dealershipWithIdOnly = await prisma.dealership.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DealershipFindManyArgs>(args?: SelectSubset<T, DealershipFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Dealership.
     * @param {DealershipCreateArgs} args - Arguments to create a Dealership.
     * @example
     * // Create one Dealership
     * const Dealership = await prisma.dealership.create({
     *   data: {
     *     // ... data to create a Dealership
     *   }
     * })
     * 
     */
    create<T extends DealershipCreateArgs>(args: SelectSubset<T, DealershipCreateArgs<ExtArgs>>): Prisma__DealershipClient<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Dealerships.
     * @param {DealershipCreateManyArgs} args - Arguments to create many Dealerships.
     * @example
     * // Create many Dealerships
     * const dealership = await prisma.dealership.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DealershipCreateManyArgs>(args?: SelectSubset<T, DealershipCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Dealerships and returns the data saved in the database.
     * @param {DealershipCreateManyAndReturnArgs} args - Arguments to create many Dealerships.
     * @example
     * // Create many Dealerships
     * const dealership = await prisma.dealership.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Dealerships and only return the `id`
     * const dealershipWithIdOnly = await prisma.dealership.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DealershipCreateManyAndReturnArgs>(args?: SelectSubset<T, DealershipCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Dealership.
     * @param {DealershipDeleteArgs} args - Arguments to delete one Dealership.
     * @example
     * // Delete one Dealership
     * const Dealership = await prisma.dealership.delete({
     *   where: {
     *     // ... filter to delete one Dealership
     *   }
     * })
     * 
     */
    delete<T extends DealershipDeleteArgs>(args: SelectSubset<T, DealershipDeleteArgs<ExtArgs>>): Prisma__DealershipClient<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Dealership.
     * @param {DealershipUpdateArgs} args - Arguments to update one Dealership.
     * @example
     * // Update one Dealership
     * const dealership = await prisma.dealership.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DealershipUpdateArgs>(args: SelectSubset<T, DealershipUpdateArgs<ExtArgs>>): Prisma__DealershipClient<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Dealerships.
     * @param {DealershipDeleteManyArgs} args - Arguments to filter Dealerships to delete.
     * @example
     * // Delete a few Dealerships
     * const { count } = await prisma.dealership.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DealershipDeleteManyArgs>(args?: SelectSubset<T, DealershipDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Dealerships.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DealershipUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Dealerships
     * const dealership = await prisma.dealership.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DealershipUpdateManyArgs>(args: SelectSubset<T, DealershipUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Dealerships and returns the data updated in the database.
     * @param {DealershipUpdateManyAndReturnArgs} args - Arguments to update many Dealerships.
     * @example
     * // Update many Dealerships
     * const dealership = await prisma.dealership.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Dealerships and only return the `id`
     * const dealershipWithIdOnly = await prisma.dealership.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DealershipUpdateManyAndReturnArgs>(args: SelectSubset<T, DealershipUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Dealership.
     * @param {DealershipUpsertArgs} args - Arguments to update or create a Dealership.
     * @example
     * // Update or create a Dealership
     * const dealership = await prisma.dealership.upsert({
     *   create: {
     *     // ... data to create a Dealership
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Dealership we want to update
     *   }
     * })
     */
    upsert<T extends DealershipUpsertArgs>(args: SelectSubset<T, DealershipUpsertArgs<ExtArgs>>): Prisma__DealershipClient<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Dealerships.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DealershipCountArgs} args - Arguments to filter Dealerships to count.
     * @example
     * // Count the number of Dealerships
     * const count = await prisma.dealership.count({
     *   where: {
     *     // ... the filter for the Dealerships we want to count
     *   }
     * })
    **/
    count<T extends DealershipCountArgs>(
      args?: Subset<T, DealershipCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DealershipCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Dealership.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DealershipAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DealershipAggregateArgs>(args: Subset<T, DealershipAggregateArgs>): Prisma.PrismaPromise<GetDealershipAggregateType<T>>

    /**
     * Group by Dealership.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DealershipGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DealershipGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DealershipGroupByArgs['orderBy'] }
        : { orderBy?: DealershipGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DealershipGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDealershipGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Dealership model
   */
  readonly fields: DealershipFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Dealership.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DealershipClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    workingHours<T extends Dealership$workingHoursArgs<ExtArgs> = {}>(args?: Subset<T, Dealership$workingHoursArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Dealership model
   */
  interface DealershipFieldRefs {
    readonly id: FieldRef<"Dealership", 'String'>
    readonly name: FieldRef<"Dealership", 'String'>
    readonly address: FieldRef<"Dealership", 'String'>
    readonly phone: FieldRef<"Dealership", 'String'>
    readonly email: FieldRef<"Dealership", 'String'>
    readonly createdAt: FieldRef<"Dealership", 'DateTime'>
    readonly updatedAt: FieldRef<"Dealership", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Dealership findUnique
   */
  export type DealershipFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DealershipInclude<ExtArgs> | null
    /**
     * Filter, which Dealership to fetch.
     */
    where: DealershipWhereUniqueInput
  }

  /**
   * Dealership findUniqueOrThrow
   */
  export type DealershipFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DealershipInclude<ExtArgs> | null
    /**
     * Filter, which Dealership to fetch.
     */
    where: DealershipWhereUniqueInput
  }

  /**
   * Dealership findFirst
   */
  export type DealershipFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DealershipInclude<ExtArgs> | null
    /**
     * Filter, which Dealership to fetch.
     */
    where?: DealershipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dealerships to fetch.
     */
    orderBy?: DealershipOrderByWithRelationInput | DealershipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Dealerships.
     */
    cursor?: DealershipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dealerships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dealerships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Dealerships.
     */
    distinct?: DealershipScalarFieldEnum | DealershipScalarFieldEnum[]
  }

  /**
   * Dealership findFirstOrThrow
   */
  export type DealershipFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DealershipInclude<ExtArgs> | null
    /**
     * Filter, which Dealership to fetch.
     */
    where?: DealershipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dealerships to fetch.
     */
    orderBy?: DealershipOrderByWithRelationInput | DealershipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Dealerships.
     */
    cursor?: DealershipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dealerships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dealerships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Dealerships.
     */
    distinct?: DealershipScalarFieldEnum | DealershipScalarFieldEnum[]
  }

  /**
   * Dealership findMany
   */
  export type DealershipFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DealershipInclude<ExtArgs> | null
    /**
     * Filter, which Dealerships to fetch.
     */
    where?: DealershipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dealerships to fetch.
     */
    orderBy?: DealershipOrderByWithRelationInput | DealershipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Dealerships.
     */
    cursor?: DealershipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dealerships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dealerships.
     */
    skip?: number
    distinct?: DealershipScalarFieldEnum | DealershipScalarFieldEnum[]
  }

  /**
   * Dealership create
   */
  export type DealershipCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DealershipInclude<ExtArgs> | null
    /**
     * The data needed to create a Dealership.
     */
    data: XOR<DealershipCreateInput, DealershipUncheckedCreateInput>
  }

  /**
   * Dealership createMany
   */
  export type DealershipCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Dealerships.
     */
    data: DealershipCreateManyInput | DealershipCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Dealership createManyAndReturn
   */
  export type DealershipCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * The data used to create many Dealerships.
     */
    data: DealershipCreateManyInput | DealershipCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Dealership update
   */
  export type DealershipUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DealershipInclude<ExtArgs> | null
    /**
     * The data needed to update a Dealership.
     */
    data: XOR<DealershipUpdateInput, DealershipUncheckedUpdateInput>
    /**
     * Choose, which Dealership to update.
     */
    where: DealershipWhereUniqueInput
  }

  /**
   * Dealership updateMany
   */
  export type DealershipUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Dealerships.
     */
    data: XOR<DealershipUpdateManyMutationInput, DealershipUncheckedUpdateManyInput>
    /**
     * Filter which Dealerships to update
     */
    where?: DealershipWhereInput
    /**
     * Limit how many Dealerships to update.
     */
    limit?: number
  }

  /**
   * Dealership updateManyAndReturn
   */
  export type DealershipUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * The data used to update Dealerships.
     */
    data: XOR<DealershipUpdateManyMutationInput, DealershipUncheckedUpdateManyInput>
    /**
     * Filter which Dealerships to update
     */
    where?: DealershipWhereInput
    /**
     * Limit how many Dealerships to update.
     */
    limit?: number
  }

  /**
   * Dealership upsert
   */
  export type DealershipUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DealershipInclude<ExtArgs> | null
    /**
     * The filter to search for the Dealership to update in case it exists.
     */
    where: DealershipWhereUniqueInput
    /**
     * In case the Dealership found by the `where` argument doesn't exist, create a new Dealership with this data.
     */
    create: XOR<DealershipCreateInput, DealershipUncheckedCreateInput>
    /**
     * In case the Dealership was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DealershipUpdateInput, DealershipUncheckedUpdateInput>
  }

  /**
   * Dealership delete
   */
  export type DealershipDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DealershipInclude<ExtArgs> | null
    /**
     * Filter which Dealership to delete.
     */
    where: DealershipWhereUniqueInput
  }

  /**
   * Dealership deleteMany
   */
  export type DealershipDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Dealerships to delete
     */
    where?: DealershipWhereInput
    /**
     * Limit how many Dealerships to delete.
     */
    limit?: number
  }

  /**
   * Dealership.workingHours
   */
  export type Dealership$workingHoursArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursInclude<ExtArgs> | null
    where?: WorkingHoursWhereInput
    orderBy?: WorkingHoursOrderByWithRelationInput | WorkingHoursOrderByWithRelationInput[]
    cursor?: WorkingHoursWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkingHoursScalarFieldEnum | WorkingHoursScalarFieldEnum[]
  }

  /**
   * Dealership without action
   */
  export type DealershipDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dealership
     */
    select?: DealershipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dealership
     */
    omit?: DealershipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DealershipInclude<ExtArgs> | null
  }


  /**
   * Model WorkingHours
   */

  export type AggregateWorkingHours = {
    _count: WorkingHoursCountAggregateOutputType | null
    _min: WorkingHoursMinAggregateOutputType | null
    _max: WorkingHoursMaxAggregateOutputType | null
  }

  export type WorkingHoursMinAggregateOutputType = {
    id: string | null
    openTime: string | null
    closeTime: string | null
    isOpen: boolean | null
    dealershipId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkingHoursMaxAggregateOutputType = {
    id: string | null
    openTime: string | null
    closeTime: string | null
    isOpen: boolean | null
    dealershipId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkingHoursCountAggregateOutputType = {
    id: number
    dayOfWeek: number
    openTime: number
    closeTime: number
    isOpen: number
    dealershipId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WorkingHoursMinAggregateInputType = {
    id?: true
    openTime?: true
    closeTime?: true
    isOpen?: true
    dealershipId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkingHoursMaxAggregateInputType = {
    id?: true
    openTime?: true
    closeTime?: true
    isOpen?: true
    dealershipId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkingHoursCountAggregateInputType = {
    id?: true
    dayOfWeek?: true
    openTime?: true
    closeTime?: true
    isOpen?: true
    dealershipId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WorkingHoursAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkingHours to aggregate.
     */
    where?: WorkingHoursWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkingHours to fetch.
     */
    orderBy?: WorkingHoursOrderByWithRelationInput | WorkingHoursOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorkingHoursWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkingHours from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkingHours.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorkingHours
    **/
    _count?: true | WorkingHoursCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkingHoursMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkingHoursMaxAggregateInputType
  }

  export type GetWorkingHoursAggregateType<T extends WorkingHoursAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkingHours]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkingHours[P]>
      : GetScalarType<T[P], AggregateWorkingHours[P]>
  }




  export type WorkingHoursGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkingHoursWhereInput
    orderBy?: WorkingHoursOrderByWithAggregationInput | WorkingHoursOrderByWithAggregationInput[]
    by: WorkingHoursScalarFieldEnum[] | WorkingHoursScalarFieldEnum
    having?: WorkingHoursScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkingHoursCountAggregateInputType | true
    _min?: WorkingHoursMinAggregateInputType
    _max?: WorkingHoursMaxAggregateInputType
  }

  export type WorkingHoursGroupByOutputType = {
    id: string
    dayOfWeek: $Enums.DayOfWeek[]
    openTime: string
    closeTime: string
    isOpen: boolean
    dealershipId: string
    createdAt: Date
    updatedAt: Date
    _count: WorkingHoursCountAggregateOutputType | null
    _min: WorkingHoursMinAggregateOutputType | null
    _max: WorkingHoursMaxAggregateOutputType | null
  }

  type GetWorkingHoursGroupByPayload<T extends WorkingHoursGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkingHoursGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkingHoursGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkingHoursGroupByOutputType[P]>
            : GetScalarType<T[P], WorkingHoursGroupByOutputType[P]>
        }
      >
    >


  export type WorkingHoursSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dayOfWeek?: boolean
    openTime?: boolean
    closeTime?: boolean
    isOpen?: boolean
    dealershipId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    dealership?: boolean | DealershipDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workingHours"]>

  export type WorkingHoursSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dayOfWeek?: boolean
    openTime?: boolean
    closeTime?: boolean
    isOpen?: boolean
    dealershipId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    dealership?: boolean | DealershipDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workingHours"]>

  export type WorkingHoursSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dayOfWeek?: boolean
    openTime?: boolean
    closeTime?: boolean
    isOpen?: boolean
    dealershipId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    dealership?: boolean | DealershipDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workingHours"]>

  export type WorkingHoursSelectScalar = {
    id?: boolean
    dayOfWeek?: boolean
    openTime?: boolean
    closeTime?: boolean
    isOpen?: boolean
    dealershipId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WorkingHoursOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "dayOfWeek" | "openTime" | "closeTime" | "isOpen" | "dealershipId" | "createdAt" | "updatedAt", ExtArgs["result"]["workingHours"]>
  export type WorkingHoursInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dealership?: boolean | DealershipDefaultArgs<ExtArgs>
  }
  export type WorkingHoursIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dealership?: boolean | DealershipDefaultArgs<ExtArgs>
  }
  export type WorkingHoursIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dealership?: boolean | DealershipDefaultArgs<ExtArgs>
  }

  export type $WorkingHoursPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorkingHours"
    objects: {
      dealership: Prisma.$DealershipPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      dayOfWeek: $Enums.DayOfWeek[]
      openTime: string
      closeTime: string
      isOpen: boolean
      dealershipId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["workingHours"]>
    composites: {}
  }

  type WorkingHoursGetPayload<S extends boolean | null | undefined | WorkingHoursDefaultArgs> = $Result.GetResult<Prisma.$WorkingHoursPayload, S>

  type WorkingHoursCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WorkingHoursFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WorkingHoursCountAggregateInputType | true
    }

  export interface WorkingHoursDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorkingHours'], meta: { name: 'WorkingHours' } }
    /**
     * Find zero or one WorkingHours that matches the filter.
     * @param {WorkingHoursFindUniqueArgs} args - Arguments to find a WorkingHours
     * @example
     * // Get one WorkingHours
     * const workingHours = await prisma.workingHours.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkingHoursFindUniqueArgs>(args: SelectSubset<T, WorkingHoursFindUniqueArgs<ExtArgs>>): Prisma__WorkingHoursClient<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WorkingHours that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorkingHoursFindUniqueOrThrowArgs} args - Arguments to find a WorkingHours
     * @example
     * // Get one WorkingHours
     * const workingHours = await prisma.workingHours.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkingHoursFindUniqueOrThrowArgs>(args: SelectSubset<T, WorkingHoursFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorkingHoursClient<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkingHours that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkingHoursFindFirstArgs} args - Arguments to find a WorkingHours
     * @example
     * // Get one WorkingHours
     * const workingHours = await prisma.workingHours.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkingHoursFindFirstArgs>(args?: SelectSubset<T, WorkingHoursFindFirstArgs<ExtArgs>>): Prisma__WorkingHoursClient<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkingHours that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkingHoursFindFirstOrThrowArgs} args - Arguments to find a WorkingHours
     * @example
     * // Get one WorkingHours
     * const workingHours = await prisma.workingHours.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkingHoursFindFirstOrThrowArgs>(args?: SelectSubset<T, WorkingHoursFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorkingHoursClient<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WorkingHours that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkingHoursFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkingHours
     * const workingHours = await prisma.workingHours.findMany()
     * 
     * // Get first 10 WorkingHours
     * const workingHours = await prisma.workingHours.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const workingHoursWithIdOnly = await prisma.workingHours.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorkingHoursFindManyArgs>(args?: SelectSubset<T, WorkingHoursFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WorkingHours.
     * @param {WorkingHoursCreateArgs} args - Arguments to create a WorkingHours.
     * @example
     * // Create one WorkingHours
     * const WorkingHours = await prisma.workingHours.create({
     *   data: {
     *     // ... data to create a WorkingHours
     *   }
     * })
     * 
     */
    create<T extends WorkingHoursCreateArgs>(args: SelectSubset<T, WorkingHoursCreateArgs<ExtArgs>>): Prisma__WorkingHoursClient<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WorkingHours.
     * @param {WorkingHoursCreateManyArgs} args - Arguments to create many WorkingHours.
     * @example
     * // Create many WorkingHours
     * const workingHours = await prisma.workingHours.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorkingHoursCreateManyArgs>(args?: SelectSubset<T, WorkingHoursCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorkingHours and returns the data saved in the database.
     * @param {WorkingHoursCreateManyAndReturnArgs} args - Arguments to create many WorkingHours.
     * @example
     * // Create many WorkingHours
     * const workingHours = await prisma.workingHours.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorkingHours and only return the `id`
     * const workingHoursWithIdOnly = await prisma.workingHours.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorkingHoursCreateManyAndReturnArgs>(args?: SelectSubset<T, WorkingHoursCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WorkingHours.
     * @param {WorkingHoursDeleteArgs} args - Arguments to delete one WorkingHours.
     * @example
     * // Delete one WorkingHours
     * const WorkingHours = await prisma.workingHours.delete({
     *   where: {
     *     // ... filter to delete one WorkingHours
     *   }
     * })
     * 
     */
    delete<T extends WorkingHoursDeleteArgs>(args: SelectSubset<T, WorkingHoursDeleteArgs<ExtArgs>>): Prisma__WorkingHoursClient<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WorkingHours.
     * @param {WorkingHoursUpdateArgs} args - Arguments to update one WorkingHours.
     * @example
     * // Update one WorkingHours
     * const workingHours = await prisma.workingHours.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorkingHoursUpdateArgs>(args: SelectSubset<T, WorkingHoursUpdateArgs<ExtArgs>>): Prisma__WorkingHoursClient<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WorkingHours.
     * @param {WorkingHoursDeleteManyArgs} args - Arguments to filter WorkingHours to delete.
     * @example
     * // Delete a few WorkingHours
     * const { count } = await prisma.workingHours.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorkingHoursDeleteManyArgs>(args?: SelectSubset<T, WorkingHoursDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkingHours.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkingHoursUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkingHours
     * const workingHours = await prisma.workingHours.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorkingHoursUpdateManyArgs>(args: SelectSubset<T, WorkingHoursUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkingHours and returns the data updated in the database.
     * @param {WorkingHoursUpdateManyAndReturnArgs} args - Arguments to update many WorkingHours.
     * @example
     * // Update many WorkingHours
     * const workingHours = await prisma.workingHours.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WorkingHours and only return the `id`
     * const workingHoursWithIdOnly = await prisma.workingHours.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WorkingHoursUpdateManyAndReturnArgs>(args: SelectSubset<T, WorkingHoursUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WorkingHours.
     * @param {WorkingHoursUpsertArgs} args - Arguments to update or create a WorkingHours.
     * @example
     * // Update or create a WorkingHours
     * const workingHours = await prisma.workingHours.upsert({
     *   create: {
     *     // ... data to create a WorkingHours
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkingHours we want to update
     *   }
     * })
     */
    upsert<T extends WorkingHoursUpsertArgs>(args: SelectSubset<T, WorkingHoursUpsertArgs<ExtArgs>>): Prisma__WorkingHoursClient<$Result.GetResult<Prisma.$WorkingHoursPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WorkingHours.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkingHoursCountArgs} args - Arguments to filter WorkingHours to count.
     * @example
     * // Count the number of WorkingHours
     * const count = await prisma.workingHours.count({
     *   where: {
     *     // ... the filter for the WorkingHours we want to count
     *   }
     * })
    **/
    count<T extends WorkingHoursCountArgs>(
      args?: Subset<T, WorkingHoursCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkingHoursCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorkingHours.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkingHoursAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkingHoursAggregateArgs>(args: Subset<T, WorkingHoursAggregateArgs>): Prisma.PrismaPromise<GetWorkingHoursAggregateType<T>>

    /**
     * Group by WorkingHours.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkingHoursGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorkingHoursGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorkingHoursGroupByArgs['orderBy'] }
        : { orderBy?: WorkingHoursGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorkingHoursGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkingHoursGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorkingHours model
   */
  readonly fields: WorkingHoursFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorkingHours.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorkingHoursClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    dealership<T extends DealershipDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DealershipDefaultArgs<ExtArgs>>): Prisma__DealershipClient<$Result.GetResult<Prisma.$DealershipPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorkingHours model
   */
  interface WorkingHoursFieldRefs {
    readonly id: FieldRef<"WorkingHours", 'String'>
    readonly dayOfWeek: FieldRef<"WorkingHours", 'DayOfWeek[]'>
    readonly openTime: FieldRef<"WorkingHours", 'String'>
    readonly closeTime: FieldRef<"WorkingHours", 'String'>
    readonly isOpen: FieldRef<"WorkingHours", 'Boolean'>
    readonly dealershipId: FieldRef<"WorkingHours", 'String'>
    readonly createdAt: FieldRef<"WorkingHours", 'DateTime'>
    readonly updatedAt: FieldRef<"WorkingHours", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorkingHours findUnique
   */
  export type WorkingHoursFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursInclude<ExtArgs> | null
    /**
     * Filter, which WorkingHours to fetch.
     */
    where: WorkingHoursWhereUniqueInput
  }

  /**
   * WorkingHours findUniqueOrThrow
   */
  export type WorkingHoursFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursInclude<ExtArgs> | null
    /**
     * Filter, which WorkingHours to fetch.
     */
    where: WorkingHoursWhereUniqueInput
  }

  /**
   * WorkingHours findFirst
   */
  export type WorkingHoursFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursInclude<ExtArgs> | null
    /**
     * Filter, which WorkingHours to fetch.
     */
    where?: WorkingHoursWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkingHours to fetch.
     */
    orderBy?: WorkingHoursOrderByWithRelationInput | WorkingHoursOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkingHours.
     */
    cursor?: WorkingHoursWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkingHours from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkingHours.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkingHours.
     */
    distinct?: WorkingHoursScalarFieldEnum | WorkingHoursScalarFieldEnum[]
  }

  /**
   * WorkingHours findFirstOrThrow
   */
  export type WorkingHoursFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursInclude<ExtArgs> | null
    /**
     * Filter, which WorkingHours to fetch.
     */
    where?: WorkingHoursWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkingHours to fetch.
     */
    orderBy?: WorkingHoursOrderByWithRelationInput | WorkingHoursOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkingHours.
     */
    cursor?: WorkingHoursWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkingHours from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkingHours.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkingHours.
     */
    distinct?: WorkingHoursScalarFieldEnum | WorkingHoursScalarFieldEnum[]
  }

  /**
   * WorkingHours findMany
   */
  export type WorkingHoursFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursInclude<ExtArgs> | null
    /**
     * Filter, which WorkingHours to fetch.
     */
    where?: WorkingHoursWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkingHours to fetch.
     */
    orderBy?: WorkingHoursOrderByWithRelationInput | WorkingHoursOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorkingHours.
     */
    cursor?: WorkingHoursWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkingHours from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkingHours.
     */
    skip?: number
    distinct?: WorkingHoursScalarFieldEnum | WorkingHoursScalarFieldEnum[]
  }

  /**
   * WorkingHours create
   */
  export type WorkingHoursCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursInclude<ExtArgs> | null
    /**
     * The data needed to create a WorkingHours.
     */
    data: XOR<WorkingHoursCreateInput, WorkingHoursUncheckedCreateInput>
  }

  /**
   * WorkingHours createMany
   */
  export type WorkingHoursCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkingHours.
     */
    data: WorkingHoursCreateManyInput | WorkingHoursCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkingHours createManyAndReturn
   */
  export type WorkingHoursCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * The data used to create many WorkingHours.
     */
    data: WorkingHoursCreateManyInput | WorkingHoursCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkingHours update
   */
  export type WorkingHoursUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursInclude<ExtArgs> | null
    /**
     * The data needed to update a WorkingHours.
     */
    data: XOR<WorkingHoursUpdateInput, WorkingHoursUncheckedUpdateInput>
    /**
     * Choose, which WorkingHours to update.
     */
    where: WorkingHoursWhereUniqueInput
  }

  /**
   * WorkingHours updateMany
   */
  export type WorkingHoursUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkingHours.
     */
    data: XOR<WorkingHoursUpdateManyMutationInput, WorkingHoursUncheckedUpdateManyInput>
    /**
     * Filter which WorkingHours to update
     */
    where?: WorkingHoursWhereInput
    /**
     * Limit how many WorkingHours to update.
     */
    limit?: number
  }

  /**
   * WorkingHours updateManyAndReturn
   */
  export type WorkingHoursUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * The data used to update WorkingHours.
     */
    data: XOR<WorkingHoursUpdateManyMutationInput, WorkingHoursUncheckedUpdateManyInput>
    /**
     * Filter which WorkingHours to update
     */
    where?: WorkingHoursWhereInput
    /**
     * Limit how many WorkingHours to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkingHours upsert
   */
  export type WorkingHoursUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursInclude<ExtArgs> | null
    /**
     * The filter to search for the WorkingHours to update in case it exists.
     */
    where: WorkingHoursWhereUniqueInput
    /**
     * In case the WorkingHours found by the `where` argument doesn't exist, create a new WorkingHours with this data.
     */
    create: XOR<WorkingHoursCreateInput, WorkingHoursUncheckedCreateInput>
    /**
     * In case the WorkingHours was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorkingHoursUpdateInput, WorkingHoursUncheckedUpdateInput>
  }

  /**
   * WorkingHours delete
   */
  export type WorkingHoursDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursInclude<ExtArgs> | null
    /**
     * Filter which WorkingHours to delete.
     */
    where: WorkingHoursWhereUniqueInput
  }

  /**
   * WorkingHours deleteMany
   */
  export type WorkingHoursDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkingHours to delete
     */
    where?: WorkingHoursWhereInput
    /**
     * Limit how many WorkingHours to delete.
     */
    limit?: number
  }

  /**
   * WorkingHours without action
   */
  export type WorkingHoursDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkingHours
     */
    select?: WorkingHoursSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkingHours
     */
    omit?: WorkingHoursOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkingHoursInclude<ExtArgs> | null
  }


  /**
   * Model SavedCar
   */

  export type AggregateSavedCar = {
    _count: SavedCarCountAggregateOutputType | null
    _min: SavedCarMinAggregateOutputType | null
    _max: SavedCarMaxAggregateOutputType | null
  }

  export type SavedCarMinAggregateOutputType = {
    id: string | null
    userId: string | null
    carId: string | null
    createdAt: Date | null
  }

  export type SavedCarMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    carId: string | null
    createdAt: Date | null
  }

  export type SavedCarCountAggregateOutputType = {
    id: number
    userId: number
    carId: number
    createdAt: number
    _all: number
  }


  export type SavedCarMinAggregateInputType = {
    id?: true
    userId?: true
    carId?: true
    createdAt?: true
  }

  export type SavedCarMaxAggregateInputType = {
    id?: true
    userId?: true
    carId?: true
    createdAt?: true
  }

  export type SavedCarCountAggregateInputType = {
    id?: true
    userId?: true
    carId?: true
    createdAt?: true
    _all?: true
  }

  export type SavedCarAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SavedCar to aggregate.
     */
    where?: SavedCarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SavedCars to fetch.
     */
    orderBy?: SavedCarOrderByWithRelationInput | SavedCarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SavedCarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SavedCars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SavedCars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SavedCars
    **/
    _count?: true | SavedCarCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SavedCarMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SavedCarMaxAggregateInputType
  }

  export type GetSavedCarAggregateType<T extends SavedCarAggregateArgs> = {
        [P in keyof T & keyof AggregateSavedCar]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSavedCar[P]>
      : GetScalarType<T[P], AggregateSavedCar[P]>
  }




  export type SavedCarGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SavedCarWhereInput
    orderBy?: SavedCarOrderByWithAggregationInput | SavedCarOrderByWithAggregationInput[]
    by: SavedCarScalarFieldEnum[] | SavedCarScalarFieldEnum
    having?: SavedCarScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SavedCarCountAggregateInputType | true
    _min?: SavedCarMinAggregateInputType
    _max?: SavedCarMaxAggregateInputType
  }

  export type SavedCarGroupByOutputType = {
    id: string
    userId: string
    carId: string
    createdAt: Date
    _count: SavedCarCountAggregateOutputType | null
    _min: SavedCarMinAggregateOutputType | null
    _max: SavedCarMaxAggregateOutputType | null
  }

  type GetSavedCarGroupByPayload<T extends SavedCarGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SavedCarGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SavedCarGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SavedCarGroupByOutputType[P]>
            : GetScalarType<T[P], SavedCarGroupByOutputType[P]>
        }
      >
    >


  export type SavedCarSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    carId?: boolean
    createdAt?: boolean
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["savedCar"]>

  export type SavedCarSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    carId?: boolean
    createdAt?: boolean
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["savedCar"]>

  export type SavedCarSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    carId?: boolean
    createdAt?: boolean
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["savedCar"]>

  export type SavedCarSelectScalar = {
    id?: boolean
    userId?: boolean
    carId?: boolean
    createdAt?: boolean
  }

  export type SavedCarOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "carId" | "createdAt", ExtArgs["result"]["savedCar"]>
  export type SavedCarInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SavedCarIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SavedCarIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SavedCarPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SavedCar"
    objects: {
      car: Prisma.$CarPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      carId: string
      createdAt: Date
    }, ExtArgs["result"]["savedCar"]>
    composites: {}
  }

  type SavedCarGetPayload<S extends boolean | null | undefined | SavedCarDefaultArgs> = $Result.GetResult<Prisma.$SavedCarPayload, S>

  type SavedCarCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SavedCarFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SavedCarCountAggregateInputType | true
    }

  export interface SavedCarDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SavedCar'], meta: { name: 'SavedCar' } }
    /**
     * Find zero or one SavedCar that matches the filter.
     * @param {SavedCarFindUniqueArgs} args - Arguments to find a SavedCar
     * @example
     * // Get one SavedCar
     * const savedCar = await prisma.savedCar.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SavedCarFindUniqueArgs>(args: SelectSubset<T, SavedCarFindUniqueArgs<ExtArgs>>): Prisma__SavedCarClient<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SavedCar that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SavedCarFindUniqueOrThrowArgs} args - Arguments to find a SavedCar
     * @example
     * // Get one SavedCar
     * const savedCar = await prisma.savedCar.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SavedCarFindUniqueOrThrowArgs>(args: SelectSubset<T, SavedCarFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SavedCarClient<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SavedCar that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SavedCarFindFirstArgs} args - Arguments to find a SavedCar
     * @example
     * // Get one SavedCar
     * const savedCar = await prisma.savedCar.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SavedCarFindFirstArgs>(args?: SelectSubset<T, SavedCarFindFirstArgs<ExtArgs>>): Prisma__SavedCarClient<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SavedCar that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SavedCarFindFirstOrThrowArgs} args - Arguments to find a SavedCar
     * @example
     * // Get one SavedCar
     * const savedCar = await prisma.savedCar.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SavedCarFindFirstOrThrowArgs>(args?: SelectSubset<T, SavedCarFindFirstOrThrowArgs<ExtArgs>>): Prisma__SavedCarClient<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SavedCars that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SavedCarFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SavedCars
     * const savedCars = await prisma.savedCar.findMany()
     * 
     * // Get first 10 SavedCars
     * const savedCars = await prisma.savedCar.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const savedCarWithIdOnly = await prisma.savedCar.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SavedCarFindManyArgs>(args?: SelectSubset<T, SavedCarFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SavedCar.
     * @param {SavedCarCreateArgs} args - Arguments to create a SavedCar.
     * @example
     * // Create one SavedCar
     * const SavedCar = await prisma.savedCar.create({
     *   data: {
     *     // ... data to create a SavedCar
     *   }
     * })
     * 
     */
    create<T extends SavedCarCreateArgs>(args: SelectSubset<T, SavedCarCreateArgs<ExtArgs>>): Prisma__SavedCarClient<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SavedCars.
     * @param {SavedCarCreateManyArgs} args - Arguments to create many SavedCars.
     * @example
     * // Create many SavedCars
     * const savedCar = await prisma.savedCar.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SavedCarCreateManyArgs>(args?: SelectSubset<T, SavedCarCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SavedCars and returns the data saved in the database.
     * @param {SavedCarCreateManyAndReturnArgs} args - Arguments to create many SavedCars.
     * @example
     * // Create many SavedCars
     * const savedCar = await prisma.savedCar.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SavedCars and only return the `id`
     * const savedCarWithIdOnly = await prisma.savedCar.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SavedCarCreateManyAndReturnArgs>(args?: SelectSubset<T, SavedCarCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SavedCar.
     * @param {SavedCarDeleteArgs} args - Arguments to delete one SavedCar.
     * @example
     * // Delete one SavedCar
     * const SavedCar = await prisma.savedCar.delete({
     *   where: {
     *     // ... filter to delete one SavedCar
     *   }
     * })
     * 
     */
    delete<T extends SavedCarDeleteArgs>(args: SelectSubset<T, SavedCarDeleteArgs<ExtArgs>>): Prisma__SavedCarClient<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SavedCar.
     * @param {SavedCarUpdateArgs} args - Arguments to update one SavedCar.
     * @example
     * // Update one SavedCar
     * const savedCar = await prisma.savedCar.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SavedCarUpdateArgs>(args: SelectSubset<T, SavedCarUpdateArgs<ExtArgs>>): Prisma__SavedCarClient<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SavedCars.
     * @param {SavedCarDeleteManyArgs} args - Arguments to filter SavedCars to delete.
     * @example
     * // Delete a few SavedCars
     * const { count } = await prisma.savedCar.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SavedCarDeleteManyArgs>(args?: SelectSubset<T, SavedCarDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SavedCars.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SavedCarUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SavedCars
     * const savedCar = await prisma.savedCar.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SavedCarUpdateManyArgs>(args: SelectSubset<T, SavedCarUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SavedCars and returns the data updated in the database.
     * @param {SavedCarUpdateManyAndReturnArgs} args - Arguments to update many SavedCars.
     * @example
     * // Update many SavedCars
     * const savedCar = await prisma.savedCar.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SavedCars and only return the `id`
     * const savedCarWithIdOnly = await prisma.savedCar.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SavedCarUpdateManyAndReturnArgs>(args: SelectSubset<T, SavedCarUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SavedCar.
     * @param {SavedCarUpsertArgs} args - Arguments to update or create a SavedCar.
     * @example
     * // Update or create a SavedCar
     * const savedCar = await prisma.savedCar.upsert({
     *   create: {
     *     // ... data to create a SavedCar
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SavedCar we want to update
     *   }
     * })
     */
    upsert<T extends SavedCarUpsertArgs>(args: SelectSubset<T, SavedCarUpsertArgs<ExtArgs>>): Prisma__SavedCarClient<$Result.GetResult<Prisma.$SavedCarPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SavedCars.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SavedCarCountArgs} args - Arguments to filter SavedCars to count.
     * @example
     * // Count the number of SavedCars
     * const count = await prisma.savedCar.count({
     *   where: {
     *     // ... the filter for the SavedCars we want to count
     *   }
     * })
    **/
    count<T extends SavedCarCountArgs>(
      args?: Subset<T, SavedCarCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SavedCarCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SavedCar.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SavedCarAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SavedCarAggregateArgs>(args: Subset<T, SavedCarAggregateArgs>): Prisma.PrismaPromise<GetSavedCarAggregateType<T>>

    /**
     * Group by SavedCar.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SavedCarGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SavedCarGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SavedCarGroupByArgs['orderBy'] }
        : { orderBy?: SavedCarGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SavedCarGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSavedCarGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SavedCar model
   */
  readonly fields: SavedCarFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SavedCar.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SavedCarClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    car<T extends CarDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CarDefaultArgs<ExtArgs>>): Prisma__CarClient<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SavedCar model
   */
  interface SavedCarFieldRefs {
    readonly id: FieldRef<"SavedCar", 'String'>
    readonly userId: FieldRef<"SavedCar", 'String'>
    readonly carId: FieldRef<"SavedCar", 'String'>
    readonly createdAt: FieldRef<"SavedCar", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SavedCar findUnique
   */
  export type SavedCarFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
    /**
     * Filter, which SavedCar to fetch.
     */
    where: SavedCarWhereUniqueInput
  }

  /**
   * SavedCar findUniqueOrThrow
   */
  export type SavedCarFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
    /**
     * Filter, which SavedCar to fetch.
     */
    where: SavedCarWhereUniqueInput
  }

  /**
   * SavedCar findFirst
   */
  export type SavedCarFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
    /**
     * Filter, which SavedCar to fetch.
     */
    where?: SavedCarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SavedCars to fetch.
     */
    orderBy?: SavedCarOrderByWithRelationInput | SavedCarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SavedCars.
     */
    cursor?: SavedCarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SavedCars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SavedCars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SavedCars.
     */
    distinct?: SavedCarScalarFieldEnum | SavedCarScalarFieldEnum[]
  }

  /**
   * SavedCar findFirstOrThrow
   */
  export type SavedCarFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
    /**
     * Filter, which SavedCar to fetch.
     */
    where?: SavedCarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SavedCars to fetch.
     */
    orderBy?: SavedCarOrderByWithRelationInput | SavedCarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SavedCars.
     */
    cursor?: SavedCarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SavedCars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SavedCars.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SavedCars.
     */
    distinct?: SavedCarScalarFieldEnum | SavedCarScalarFieldEnum[]
  }

  /**
   * SavedCar findMany
   */
  export type SavedCarFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
    /**
     * Filter, which SavedCars to fetch.
     */
    where?: SavedCarWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SavedCars to fetch.
     */
    orderBy?: SavedCarOrderByWithRelationInput | SavedCarOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SavedCars.
     */
    cursor?: SavedCarWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SavedCars from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SavedCars.
     */
    skip?: number
    distinct?: SavedCarScalarFieldEnum | SavedCarScalarFieldEnum[]
  }

  /**
   * SavedCar create
   */
  export type SavedCarCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
    /**
     * The data needed to create a SavedCar.
     */
    data: XOR<SavedCarCreateInput, SavedCarUncheckedCreateInput>
  }

  /**
   * SavedCar createMany
   */
  export type SavedCarCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SavedCars.
     */
    data: SavedCarCreateManyInput | SavedCarCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SavedCar createManyAndReturn
   */
  export type SavedCarCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * The data used to create many SavedCars.
     */
    data: SavedCarCreateManyInput | SavedCarCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SavedCar update
   */
  export type SavedCarUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
    /**
     * The data needed to update a SavedCar.
     */
    data: XOR<SavedCarUpdateInput, SavedCarUncheckedUpdateInput>
    /**
     * Choose, which SavedCar to update.
     */
    where: SavedCarWhereUniqueInput
  }

  /**
   * SavedCar updateMany
   */
  export type SavedCarUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SavedCars.
     */
    data: XOR<SavedCarUpdateManyMutationInput, SavedCarUncheckedUpdateManyInput>
    /**
     * Filter which SavedCars to update
     */
    where?: SavedCarWhereInput
    /**
     * Limit how many SavedCars to update.
     */
    limit?: number
  }

  /**
   * SavedCar updateManyAndReturn
   */
  export type SavedCarUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * The data used to update SavedCars.
     */
    data: XOR<SavedCarUpdateManyMutationInput, SavedCarUncheckedUpdateManyInput>
    /**
     * Filter which SavedCars to update
     */
    where?: SavedCarWhereInput
    /**
     * Limit how many SavedCars to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SavedCar upsert
   */
  export type SavedCarUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
    /**
     * The filter to search for the SavedCar to update in case it exists.
     */
    where: SavedCarWhereUniqueInput
    /**
     * In case the SavedCar found by the `where` argument doesn't exist, create a new SavedCar with this data.
     */
    create: XOR<SavedCarCreateInput, SavedCarUncheckedCreateInput>
    /**
     * In case the SavedCar was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SavedCarUpdateInput, SavedCarUncheckedUpdateInput>
  }

  /**
   * SavedCar delete
   */
  export type SavedCarDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
    /**
     * Filter which SavedCar to delete.
     */
    where: SavedCarWhereUniqueInput
  }

  /**
   * SavedCar deleteMany
   */
  export type SavedCarDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SavedCars to delete
     */
    where?: SavedCarWhereInput
    /**
     * Limit how many SavedCars to delete.
     */
    limit?: number
  }

  /**
   * SavedCar without action
   */
  export type SavedCarDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SavedCar
     */
    select?: SavedCarSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SavedCar
     */
    omit?: SavedCarOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SavedCarInclude<ExtArgs> | null
  }


  /**
   * Model TestDrive
   */

  export type AggregateTestDrive = {
    _count: TestDriveCountAggregateOutputType | null
    _min: TestDriveMinAggregateOutputType | null
    _max: TestDriveMaxAggregateOutputType | null
  }

  export type TestDriveMinAggregateOutputType = {
    id: string | null
    status: $Enums.TestDriveStatus | null
    date: Date | null
    startTime: string | null
    endTime: string | null
    notes: string | null
    userId: string | null
    carId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TestDriveMaxAggregateOutputType = {
    id: string | null
    status: $Enums.TestDriveStatus | null
    date: Date | null
    startTime: string | null
    endTime: string | null
    notes: string | null
    userId: string | null
    carId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TestDriveCountAggregateOutputType = {
    id: number
    status: number
    date: number
    startTime: number
    endTime: number
    notes: number
    userId: number
    carId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TestDriveMinAggregateInputType = {
    id?: true
    status?: true
    date?: true
    startTime?: true
    endTime?: true
    notes?: true
    userId?: true
    carId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TestDriveMaxAggregateInputType = {
    id?: true
    status?: true
    date?: true
    startTime?: true
    endTime?: true
    notes?: true
    userId?: true
    carId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TestDriveCountAggregateInputType = {
    id?: true
    status?: true
    date?: true
    startTime?: true
    endTime?: true
    notes?: true
    userId?: true
    carId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TestDriveAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestDrive to aggregate.
     */
    where?: TestDriveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestDrives to fetch.
     */
    orderBy?: TestDriveOrderByWithRelationInput | TestDriveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TestDriveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestDrives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestDrives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TestDrives
    **/
    _count?: true | TestDriveCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TestDriveMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TestDriveMaxAggregateInputType
  }

  export type GetTestDriveAggregateType<T extends TestDriveAggregateArgs> = {
        [P in keyof T & keyof AggregateTestDrive]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTestDrive[P]>
      : GetScalarType<T[P], AggregateTestDrive[P]>
  }




  export type TestDriveGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestDriveWhereInput
    orderBy?: TestDriveOrderByWithAggregationInput | TestDriveOrderByWithAggregationInput[]
    by: TestDriveScalarFieldEnum[] | TestDriveScalarFieldEnum
    having?: TestDriveScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TestDriveCountAggregateInputType | true
    _min?: TestDriveMinAggregateInputType
    _max?: TestDriveMaxAggregateInputType
  }

  export type TestDriveGroupByOutputType = {
    id: string
    status: $Enums.TestDriveStatus
    date: Date
    startTime: string
    endTime: string
    notes: string | null
    userId: string
    carId: string
    createdAt: Date
    updatedAt: Date
    _count: TestDriveCountAggregateOutputType | null
    _min: TestDriveMinAggregateOutputType | null
    _max: TestDriveMaxAggregateOutputType | null
  }

  type GetTestDriveGroupByPayload<T extends TestDriveGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TestDriveGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TestDriveGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TestDriveGroupByOutputType[P]>
            : GetScalarType<T[P], TestDriveGroupByOutputType[P]>
        }
      >
    >


  export type TestDriveSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    status?: boolean
    date?: boolean
    startTime?: boolean
    endTime?: boolean
    notes?: boolean
    userId?: boolean
    carId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testDrive"]>

  export type TestDriveSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    status?: boolean
    date?: boolean
    startTime?: boolean
    endTime?: boolean
    notes?: boolean
    userId?: boolean
    carId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testDrive"]>

  export type TestDriveSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    status?: boolean
    date?: boolean
    startTime?: boolean
    endTime?: boolean
    notes?: boolean
    userId?: boolean
    carId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["testDrive"]>

  export type TestDriveSelectScalar = {
    id?: boolean
    status?: boolean
    date?: boolean
    startTime?: boolean
    endTime?: boolean
    notes?: boolean
    userId?: boolean
    carId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TestDriveOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "status" | "date" | "startTime" | "endTime" | "notes" | "userId" | "carId" | "createdAt" | "updatedAt", ExtArgs["result"]["testDrive"]>
  export type TestDriveInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type TestDriveIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type TestDriveIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    car?: boolean | CarDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $TestDrivePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TestDrive"
    objects: {
      car: Prisma.$CarPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      status: $Enums.TestDriveStatus
      date: Date
      startTime: string
      endTime: string
      notes: string | null
      userId: string
      carId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["testDrive"]>
    composites: {}
  }

  type TestDriveGetPayload<S extends boolean | null | undefined | TestDriveDefaultArgs> = $Result.GetResult<Prisma.$TestDrivePayload, S>

  type TestDriveCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TestDriveFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TestDriveCountAggregateInputType | true
    }

  export interface TestDriveDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TestDrive'], meta: { name: 'TestDrive' } }
    /**
     * Find zero or one TestDrive that matches the filter.
     * @param {TestDriveFindUniqueArgs} args - Arguments to find a TestDrive
     * @example
     * // Get one TestDrive
     * const testDrive = await prisma.testDrive.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TestDriveFindUniqueArgs>(args: SelectSubset<T, TestDriveFindUniqueArgs<ExtArgs>>): Prisma__TestDriveClient<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TestDrive that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TestDriveFindUniqueOrThrowArgs} args - Arguments to find a TestDrive
     * @example
     * // Get one TestDrive
     * const testDrive = await prisma.testDrive.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TestDriveFindUniqueOrThrowArgs>(args: SelectSubset<T, TestDriveFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TestDriveClient<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TestDrive that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestDriveFindFirstArgs} args - Arguments to find a TestDrive
     * @example
     * // Get one TestDrive
     * const testDrive = await prisma.testDrive.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TestDriveFindFirstArgs>(args?: SelectSubset<T, TestDriveFindFirstArgs<ExtArgs>>): Prisma__TestDriveClient<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TestDrive that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestDriveFindFirstOrThrowArgs} args - Arguments to find a TestDrive
     * @example
     * // Get one TestDrive
     * const testDrive = await prisma.testDrive.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TestDriveFindFirstOrThrowArgs>(args?: SelectSubset<T, TestDriveFindFirstOrThrowArgs<ExtArgs>>): Prisma__TestDriveClient<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TestDrives that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestDriveFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TestDrives
     * const testDrives = await prisma.testDrive.findMany()
     * 
     * // Get first 10 TestDrives
     * const testDrives = await prisma.testDrive.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const testDriveWithIdOnly = await prisma.testDrive.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TestDriveFindManyArgs>(args?: SelectSubset<T, TestDriveFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TestDrive.
     * @param {TestDriveCreateArgs} args - Arguments to create a TestDrive.
     * @example
     * // Create one TestDrive
     * const TestDrive = await prisma.testDrive.create({
     *   data: {
     *     // ... data to create a TestDrive
     *   }
     * })
     * 
     */
    create<T extends TestDriveCreateArgs>(args: SelectSubset<T, TestDriveCreateArgs<ExtArgs>>): Prisma__TestDriveClient<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TestDrives.
     * @param {TestDriveCreateManyArgs} args - Arguments to create many TestDrives.
     * @example
     * // Create many TestDrives
     * const testDrive = await prisma.testDrive.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TestDriveCreateManyArgs>(args?: SelectSubset<T, TestDriveCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TestDrives and returns the data saved in the database.
     * @param {TestDriveCreateManyAndReturnArgs} args - Arguments to create many TestDrives.
     * @example
     * // Create many TestDrives
     * const testDrive = await prisma.testDrive.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TestDrives and only return the `id`
     * const testDriveWithIdOnly = await prisma.testDrive.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TestDriveCreateManyAndReturnArgs>(args?: SelectSubset<T, TestDriveCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TestDrive.
     * @param {TestDriveDeleteArgs} args - Arguments to delete one TestDrive.
     * @example
     * // Delete one TestDrive
     * const TestDrive = await prisma.testDrive.delete({
     *   where: {
     *     // ... filter to delete one TestDrive
     *   }
     * })
     * 
     */
    delete<T extends TestDriveDeleteArgs>(args: SelectSubset<T, TestDriveDeleteArgs<ExtArgs>>): Prisma__TestDriveClient<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TestDrive.
     * @param {TestDriveUpdateArgs} args - Arguments to update one TestDrive.
     * @example
     * // Update one TestDrive
     * const testDrive = await prisma.testDrive.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TestDriveUpdateArgs>(args: SelectSubset<T, TestDriveUpdateArgs<ExtArgs>>): Prisma__TestDriveClient<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TestDrives.
     * @param {TestDriveDeleteManyArgs} args - Arguments to filter TestDrives to delete.
     * @example
     * // Delete a few TestDrives
     * const { count } = await prisma.testDrive.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TestDriveDeleteManyArgs>(args?: SelectSubset<T, TestDriveDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TestDrives.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestDriveUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TestDrives
     * const testDrive = await prisma.testDrive.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TestDriveUpdateManyArgs>(args: SelectSubset<T, TestDriveUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TestDrives and returns the data updated in the database.
     * @param {TestDriveUpdateManyAndReturnArgs} args - Arguments to update many TestDrives.
     * @example
     * // Update many TestDrives
     * const testDrive = await prisma.testDrive.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TestDrives and only return the `id`
     * const testDriveWithIdOnly = await prisma.testDrive.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TestDriveUpdateManyAndReturnArgs>(args: SelectSubset<T, TestDriveUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TestDrive.
     * @param {TestDriveUpsertArgs} args - Arguments to update or create a TestDrive.
     * @example
     * // Update or create a TestDrive
     * const testDrive = await prisma.testDrive.upsert({
     *   create: {
     *     // ... data to create a TestDrive
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TestDrive we want to update
     *   }
     * })
     */
    upsert<T extends TestDriveUpsertArgs>(args: SelectSubset<T, TestDriveUpsertArgs<ExtArgs>>): Prisma__TestDriveClient<$Result.GetResult<Prisma.$TestDrivePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TestDrives.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestDriveCountArgs} args - Arguments to filter TestDrives to count.
     * @example
     * // Count the number of TestDrives
     * const count = await prisma.testDrive.count({
     *   where: {
     *     // ... the filter for the TestDrives we want to count
     *   }
     * })
    **/
    count<T extends TestDriveCountArgs>(
      args?: Subset<T, TestDriveCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TestDriveCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TestDrive.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestDriveAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TestDriveAggregateArgs>(args: Subset<T, TestDriveAggregateArgs>): Prisma.PrismaPromise<GetTestDriveAggregateType<T>>

    /**
     * Group by TestDrive.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestDriveGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TestDriveGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TestDriveGroupByArgs['orderBy'] }
        : { orderBy?: TestDriveGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TestDriveGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTestDriveGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TestDrive model
   */
  readonly fields: TestDriveFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TestDrive.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TestDriveClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    car<T extends CarDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CarDefaultArgs<ExtArgs>>): Prisma__CarClient<$Result.GetResult<Prisma.$CarPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TestDrive model
   */
  interface TestDriveFieldRefs {
    readonly id: FieldRef<"TestDrive", 'String'>
    readonly status: FieldRef<"TestDrive", 'TestDriveStatus'>
    readonly date: FieldRef<"TestDrive", 'DateTime'>
    readonly startTime: FieldRef<"TestDrive", 'String'>
    readonly endTime: FieldRef<"TestDrive", 'String'>
    readonly notes: FieldRef<"TestDrive", 'String'>
    readonly userId: FieldRef<"TestDrive", 'String'>
    readonly carId: FieldRef<"TestDrive", 'String'>
    readonly createdAt: FieldRef<"TestDrive", 'DateTime'>
    readonly updatedAt: FieldRef<"TestDrive", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TestDrive findUnique
   */
  export type TestDriveFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
    /**
     * Filter, which TestDrive to fetch.
     */
    where: TestDriveWhereUniqueInput
  }

  /**
   * TestDrive findUniqueOrThrow
   */
  export type TestDriveFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
    /**
     * Filter, which TestDrive to fetch.
     */
    where: TestDriveWhereUniqueInput
  }

  /**
   * TestDrive findFirst
   */
  export type TestDriveFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
    /**
     * Filter, which TestDrive to fetch.
     */
    where?: TestDriveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestDrives to fetch.
     */
    orderBy?: TestDriveOrderByWithRelationInput | TestDriveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestDrives.
     */
    cursor?: TestDriveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestDrives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestDrives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestDrives.
     */
    distinct?: TestDriveScalarFieldEnum | TestDriveScalarFieldEnum[]
  }

  /**
   * TestDrive findFirstOrThrow
   */
  export type TestDriveFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
    /**
     * Filter, which TestDrive to fetch.
     */
    where?: TestDriveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestDrives to fetch.
     */
    orderBy?: TestDriveOrderByWithRelationInput | TestDriveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TestDrives.
     */
    cursor?: TestDriveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestDrives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestDrives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TestDrives.
     */
    distinct?: TestDriveScalarFieldEnum | TestDriveScalarFieldEnum[]
  }

  /**
   * TestDrive findMany
   */
  export type TestDriveFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
    /**
     * Filter, which TestDrives to fetch.
     */
    where?: TestDriveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TestDrives to fetch.
     */
    orderBy?: TestDriveOrderByWithRelationInput | TestDriveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TestDrives.
     */
    cursor?: TestDriveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TestDrives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TestDrives.
     */
    skip?: number
    distinct?: TestDriveScalarFieldEnum | TestDriveScalarFieldEnum[]
  }

  /**
   * TestDrive create
   */
  export type TestDriveCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
    /**
     * The data needed to create a TestDrive.
     */
    data: XOR<TestDriveCreateInput, TestDriveUncheckedCreateInput>
  }

  /**
   * TestDrive createMany
   */
  export type TestDriveCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TestDrives.
     */
    data: TestDriveCreateManyInput | TestDriveCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TestDrive createManyAndReturn
   */
  export type TestDriveCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * The data used to create many TestDrives.
     */
    data: TestDriveCreateManyInput | TestDriveCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TestDrive update
   */
  export type TestDriveUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
    /**
     * The data needed to update a TestDrive.
     */
    data: XOR<TestDriveUpdateInput, TestDriveUncheckedUpdateInput>
    /**
     * Choose, which TestDrive to update.
     */
    where: TestDriveWhereUniqueInput
  }

  /**
   * TestDrive updateMany
   */
  export type TestDriveUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TestDrives.
     */
    data: XOR<TestDriveUpdateManyMutationInput, TestDriveUncheckedUpdateManyInput>
    /**
     * Filter which TestDrives to update
     */
    where?: TestDriveWhereInput
    /**
     * Limit how many TestDrives to update.
     */
    limit?: number
  }

  /**
   * TestDrive updateManyAndReturn
   */
  export type TestDriveUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * The data used to update TestDrives.
     */
    data: XOR<TestDriveUpdateManyMutationInput, TestDriveUncheckedUpdateManyInput>
    /**
     * Filter which TestDrives to update
     */
    where?: TestDriveWhereInput
    /**
     * Limit how many TestDrives to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TestDrive upsert
   */
  export type TestDriveUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
    /**
     * The filter to search for the TestDrive to update in case it exists.
     */
    where: TestDriveWhereUniqueInput
    /**
     * In case the TestDrive found by the `where` argument doesn't exist, create a new TestDrive with this data.
     */
    create: XOR<TestDriveCreateInput, TestDriveUncheckedCreateInput>
    /**
     * In case the TestDrive was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TestDriveUpdateInput, TestDriveUncheckedUpdateInput>
  }

  /**
   * TestDrive delete
   */
  export type TestDriveDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
    /**
     * Filter which TestDrive to delete.
     */
    where: TestDriveWhereUniqueInput
  }

  /**
   * TestDrive deleteMany
   */
  export type TestDriveDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TestDrives to delete
     */
    where?: TestDriveWhereInput
    /**
     * Limit how many TestDrives to delete.
     */
    limit?: number
  }

  /**
   * TestDrive without action
   */
  export type TestDriveDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TestDrive
     */
    select?: TestDriveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TestDrive
     */
    omit?: TestDriveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TestDriveInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    clerkId: 'clerkId',
    email: 'email',
    name: 'name',
    imageUrl: 'imageUrl',
    phone: 'phone',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    role: 'role'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const CarScalarFieldEnum: {
    id: 'id',
    make: 'make',
    model: 'model',
    year: 'year',
    price: 'price',
    mileage: 'mileage',
    fuelType: 'fuelType',
    transmission: 'transmission',
    color: 'color',
    seats: 'seats',
    bodyType: 'bodyType',
    featured: 'featured',
    status: 'status',
    images: 'images',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    title: 'title',
    description: 'description',
    location: 'location',
    features: 'features'
  };

  export type CarScalarFieldEnum = (typeof CarScalarFieldEnum)[keyof typeof CarScalarFieldEnum]


  export const DealershipScalarFieldEnum: {
    id: 'id',
    name: 'name',
    address: 'address',
    phone: 'phone',
    email: 'email',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type DealershipScalarFieldEnum = (typeof DealershipScalarFieldEnum)[keyof typeof DealershipScalarFieldEnum]


  export const WorkingHoursScalarFieldEnum: {
    id: 'id',
    dayOfWeek: 'dayOfWeek',
    openTime: 'openTime',
    closeTime: 'closeTime',
    isOpen: 'isOpen',
    dealershipId: 'dealershipId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WorkingHoursScalarFieldEnum = (typeof WorkingHoursScalarFieldEnum)[keyof typeof WorkingHoursScalarFieldEnum]


  export const SavedCarScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    carId: 'carId',
    createdAt: 'createdAt'
  };

  export type SavedCarScalarFieldEnum = (typeof SavedCarScalarFieldEnum)[keyof typeof SavedCarScalarFieldEnum]


  export const TestDriveScalarFieldEnum: {
    id: 'id',
    status: 'status',
    date: 'date',
    startTime: 'startTime',
    endTime: 'endTime',
    notes: 'notes',
    userId: 'userId',
    carId: 'carId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TestDriveScalarFieldEnum = (typeof TestDriveScalarFieldEnum)[keyof typeof TestDriveScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'UserRole'
   */
  export type EnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole'>
    


  /**
   * Reference to a field of type 'UserRole[]'
   */
  export type ListEnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'CarStatus'
   */
  export type EnumCarStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CarStatus'>
    


  /**
   * Reference to a field of type 'CarStatus[]'
   */
  export type ListEnumCarStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CarStatus[]'>
    


  /**
   * Reference to a field of type 'DayOfWeek[]'
   */
  export type ListEnumDayOfWeekFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DayOfWeek[]'>
    


  /**
   * Reference to a field of type 'DayOfWeek'
   */
  export type EnumDayOfWeekFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DayOfWeek'>
    


  /**
   * Reference to a field of type 'TestDriveStatus'
   */
  export type EnumTestDriveStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TestDriveStatus'>
    


  /**
   * Reference to a field of type 'TestDriveStatus[]'
   */
  export type ListEnumTestDriveStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TestDriveStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    clerkId?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    imageUrl?: StringNullableFilter<"User"> | string | null
    phone?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    savedCars?: SavedCarListRelationFilter
    testDrives?: TestDriveListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    clerkId?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    role?: SortOrder
    savedCars?: SavedCarOrderByRelationAggregateInput
    testDrives?: TestDriveOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    clerkId?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    imageUrl?: StringNullableFilter<"User"> | string | null
    phone?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    savedCars?: SavedCarListRelationFilter
    testDrives?: TestDriveListRelationFilter
  }, "id" | "clerkId" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    clerkId?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    role?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    clerkId?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    imageUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    phone?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    role?: EnumUserRoleWithAggregatesFilter<"User"> | $Enums.UserRole
  }

  export type CarWhereInput = {
    AND?: CarWhereInput | CarWhereInput[]
    OR?: CarWhereInput[]
    NOT?: CarWhereInput | CarWhereInput[]
    id?: StringFilter<"Car"> | string
    make?: StringFilter<"Car"> | string
    model?: StringFilter<"Car"> | string
    year?: IntFilter<"Car"> | number
    price?: DecimalFilter<"Car"> | Decimal | DecimalJsLike | number | string
    mileage?: IntFilter<"Car"> | number
    fuelType?: StringFilter<"Car"> | string
    transmission?: StringFilter<"Car"> | string
    color?: StringFilter<"Car"> | string
    seats?: IntNullableFilter<"Car"> | number | null
    bodyType?: StringFilter<"Car"> | string
    featured?: BoolFilter<"Car"> | boolean
    status?: EnumCarStatusFilter<"Car"> | $Enums.CarStatus
    images?: StringNullableListFilter<"Car">
    createdAt?: DateTimeFilter<"Car"> | Date | string
    updatedAt?: DateTimeFilter<"Car"> | Date | string
    title?: StringNullableFilter<"Car"> | string | null
    description?: StringNullableFilter<"Car"> | string | null
    location?: StringNullableFilter<"Car"> | string | null
    features?: StringNullableListFilter<"Car">
    savedBy?: SavedCarListRelationFilter
    testDrive?: TestDriveListRelationFilter
  }

  export type CarOrderByWithRelationInput = {
    id?: SortOrder
    make?: SortOrder
    model?: SortOrder
    year?: SortOrder
    price?: SortOrder
    mileage?: SortOrder
    fuelType?: SortOrder
    transmission?: SortOrder
    color?: SortOrder
    seats?: SortOrderInput | SortOrder
    bodyType?: SortOrder
    featured?: SortOrder
    status?: SortOrder
    images?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    title?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    features?: SortOrder
    savedBy?: SavedCarOrderByRelationAggregateInput
    testDrive?: TestDriveOrderByRelationAggregateInput
  }

  export type CarWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CarWhereInput | CarWhereInput[]
    OR?: CarWhereInput[]
    NOT?: CarWhereInput | CarWhereInput[]
    make?: StringFilter<"Car"> | string
    model?: StringFilter<"Car"> | string
    year?: IntFilter<"Car"> | number
    price?: DecimalFilter<"Car"> | Decimal | DecimalJsLike | number | string
    mileage?: IntFilter<"Car"> | number
    fuelType?: StringFilter<"Car"> | string
    transmission?: StringFilter<"Car"> | string
    color?: StringFilter<"Car"> | string
    seats?: IntNullableFilter<"Car"> | number | null
    bodyType?: StringFilter<"Car"> | string
    featured?: BoolFilter<"Car"> | boolean
    status?: EnumCarStatusFilter<"Car"> | $Enums.CarStatus
    images?: StringNullableListFilter<"Car">
    createdAt?: DateTimeFilter<"Car"> | Date | string
    updatedAt?: DateTimeFilter<"Car"> | Date | string
    title?: StringNullableFilter<"Car"> | string | null
    description?: StringNullableFilter<"Car"> | string | null
    location?: StringNullableFilter<"Car"> | string | null
    features?: StringNullableListFilter<"Car">
    savedBy?: SavedCarListRelationFilter
    testDrive?: TestDriveListRelationFilter
  }, "id">

  export type CarOrderByWithAggregationInput = {
    id?: SortOrder
    make?: SortOrder
    model?: SortOrder
    year?: SortOrder
    price?: SortOrder
    mileage?: SortOrder
    fuelType?: SortOrder
    transmission?: SortOrder
    color?: SortOrder
    seats?: SortOrderInput | SortOrder
    bodyType?: SortOrder
    featured?: SortOrder
    status?: SortOrder
    images?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    title?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    features?: SortOrder
    _count?: CarCountOrderByAggregateInput
    _avg?: CarAvgOrderByAggregateInput
    _max?: CarMaxOrderByAggregateInput
    _min?: CarMinOrderByAggregateInput
    _sum?: CarSumOrderByAggregateInput
  }

  export type CarScalarWhereWithAggregatesInput = {
    AND?: CarScalarWhereWithAggregatesInput | CarScalarWhereWithAggregatesInput[]
    OR?: CarScalarWhereWithAggregatesInput[]
    NOT?: CarScalarWhereWithAggregatesInput | CarScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Car"> | string
    make?: StringWithAggregatesFilter<"Car"> | string
    model?: StringWithAggregatesFilter<"Car"> | string
    year?: IntWithAggregatesFilter<"Car"> | number
    price?: DecimalWithAggregatesFilter<"Car"> | Decimal | DecimalJsLike | number | string
    mileage?: IntWithAggregatesFilter<"Car"> | number
    fuelType?: StringWithAggregatesFilter<"Car"> | string
    transmission?: StringWithAggregatesFilter<"Car"> | string
    color?: StringWithAggregatesFilter<"Car"> | string
    seats?: IntNullableWithAggregatesFilter<"Car"> | number | null
    bodyType?: StringWithAggregatesFilter<"Car"> | string
    featured?: BoolWithAggregatesFilter<"Car"> | boolean
    status?: EnumCarStatusWithAggregatesFilter<"Car"> | $Enums.CarStatus
    images?: StringNullableListFilter<"Car">
    createdAt?: DateTimeWithAggregatesFilter<"Car"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Car"> | Date | string
    title?: StringNullableWithAggregatesFilter<"Car"> | string | null
    description?: StringNullableWithAggregatesFilter<"Car"> | string | null
    location?: StringNullableWithAggregatesFilter<"Car"> | string | null
    features?: StringNullableListFilter<"Car">
  }

  export type DealershipWhereInput = {
    AND?: DealershipWhereInput | DealershipWhereInput[]
    OR?: DealershipWhereInput[]
    NOT?: DealershipWhereInput | DealershipWhereInput[]
    id?: StringFilter<"Dealership"> | string
    name?: StringFilter<"Dealership"> | string
    address?: StringFilter<"Dealership"> | string
    phone?: StringFilter<"Dealership"> | string
    email?: StringFilter<"Dealership"> | string
    createdAt?: DateTimeFilter<"Dealership"> | Date | string
    updatedAt?: DateTimeFilter<"Dealership"> | Date | string
    workingHours?: WorkingHoursListRelationFilter
  }

  export type DealershipOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    address?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    workingHours?: WorkingHoursOrderByRelationAggregateInput
  }

  export type DealershipWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DealershipWhereInput | DealershipWhereInput[]
    OR?: DealershipWhereInput[]
    NOT?: DealershipWhereInput | DealershipWhereInput[]
    name?: StringFilter<"Dealership"> | string
    address?: StringFilter<"Dealership"> | string
    phone?: StringFilter<"Dealership"> | string
    email?: StringFilter<"Dealership"> | string
    createdAt?: DateTimeFilter<"Dealership"> | Date | string
    updatedAt?: DateTimeFilter<"Dealership"> | Date | string
    workingHours?: WorkingHoursListRelationFilter
  }, "id">

  export type DealershipOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    address?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: DealershipCountOrderByAggregateInput
    _max?: DealershipMaxOrderByAggregateInput
    _min?: DealershipMinOrderByAggregateInput
  }

  export type DealershipScalarWhereWithAggregatesInput = {
    AND?: DealershipScalarWhereWithAggregatesInput | DealershipScalarWhereWithAggregatesInput[]
    OR?: DealershipScalarWhereWithAggregatesInput[]
    NOT?: DealershipScalarWhereWithAggregatesInput | DealershipScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Dealership"> | string
    name?: StringWithAggregatesFilter<"Dealership"> | string
    address?: StringWithAggregatesFilter<"Dealership"> | string
    phone?: StringWithAggregatesFilter<"Dealership"> | string
    email?: StringWithAggregatesFilter<"Dealership"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Dealership"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Dealership"> | Date | string
  }

  export type WorkingHoursWhereInput = {
    AND?: WorkingHoursWhereInput | WorkingHoursWhereInput[]
    OR?: WorkingHoursWhereInput[]
    NOT?: WorkingHoursWhereInput | WorkingHoursWhereInput[]
    id?: StringFilter<"WorkingHours"> | string
    dayOfWeek?: EnumDayOfWeekNullableListFilter<"WorkingHours">
    openTime?: StringFilter<"WorkingHours"> | string
    closeTime?: StringFilter<"WorkingHours"> | string
    isOpen?: BoolFilter<"WorkingHours"> | boolean
    dealershipId?: StringFilter<"WorkingHours"> | string
    createdAt?: DateTimeFilter<"WorkingHours"> | Date | string
    updatedAt?: DateTimeFilter<"WorkingHours"> | Date | string
    dealership?: XOR<DealershipScalarRelationFilter, DealershipWhereInput>
  }

  export type WorkingHoursOrderByWithRelationInput = {
    id?: SortOrder
    dayOfWeek?: SortOrder
    openTime?: SortOrder
    closeTime?: SortOrder
    isOpen?: SortOrder
    dealershipId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dealership?: DealershipOrderByWithRelationInput
  }

  export type WorkingHoursWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    dayOfWeek_dealershipId?: WorkingHoursDayOfWeekDealershipIdCompoundUniqueInput
    AND?: WorkingHoursWhereInput | WorkingHoursWhereInput[]
    OR?: WorkingHoursWhereInput[]
    NOT?: WorkingHoursWhereInput | WorkingHoursWhereInput[]
    dayOfWeek?: EnumDayOfWeekNullableListFilter<"WorkingHours">
    openTime?: StringFilter<"WorkingHours"> | string
    closeTime?: StringFilter<"WorkingHours"> | string
    isOpen?: BoolFilter<"WorkingHours"> | boolean
    dealershipId?: StringFilter<"WorkingHours"> | string
    createdAt?: DateTimeFilter<"WorkingHours"> | Date | string
    updatedAt?: DateTimeFilter<"WorkingHours"> | Date | string
    dealership?: XOR<DealershipScalarRelationFilter, DealershipWhereInput>
  }, "id" | "dayOfWeek_dealershipId">

  export type WorkingHoursOrderByWithAggregationInput = {
    id?: SortOrder
    dayOfWeek?: SortOrder
    openTime?: SortOrder
    closeTime?: SortOrder
    isOpen?: SortOrder
    dealershipId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WorkingHoursCountOrderByAggregateInput
    _max?: WorkingHoursMaxOrderByAggregateInput
    _min?: WorkingHoursMinOrderByAggregateInput
  }

  export type WorkingHoursScalarWhereWithAggregatesInput = {
    AND?: WorkingHoursScalarWhereWithAggregatesInput | WorkingHoursScalarWhereWithAggregatesInput[]
    OR?: WorkingHoursScalarWhereWithAggregatesInput[]
    NOT?: WorkingHoursScalarWhereWithAggregatesInput | WorkingHoursScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorkingHours"> | string
    dayOfWeek?: EnumDayOfWeekNullableListFilter<"WorkingHours">
    openTime?: StringWithAggregatesFilter<"WorkingHours"> | string
    closeTime?: StringWithAggregatesFilter<"WorkingHours"> | string
    isOpen?: BoolWithAggregatesFilter<"WorkingHours"> | boolean
    dealershipId?: StringWithAggregatesFilter<"WorkingHours"> | string
    createdAt?: DateTimeWithAggregatesFilter<"WorkingHours"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WorkingHours"> | Date | string
  }

  export type SavedCarWhereInput = {
    AND?: SavedCarWhereInput | SavedCarWhereInput[]
    OR?: SavedCarWhereInput[]
    NOT?: SavedCarWhereInput | SavedCarWhereInput[]
    id?: StringFilter<"SavedCar"> | string
    userId?: StringFilter<"SavedCar"> | string
    carId?: StringFilter<"SavedCar"> | string
    createdAt?: DateTimeFilter<"SavedCar"> | Date | string
    car?: XOR<CarScalarRelationFilter, CarWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SavedCarOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    carId?: SortOrder
    createdAt?: SortOrder
    car?: CarOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type SavedCarWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_carId?: SavedCarUserIdCarIdCompoundUniqueInput
    AND?: SavedCarWhereInput | SavedCarWhereInput[]
    OR?: SavedCarWhereInput[]
    NOT?: SavedCarWhereInput | SavedCarWhereInput[]
    userId?: StringFilter<"SavedCar"> | string
    carId?: StringFilter<"SavedCar"> | string
    createdAt?: DateTimeFilter<"SavedCar"> | Date | string
    car?: XOR<CarScalarRelationFilter, CarWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId_carId">

  export type SavedCarOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    carId?: SortOrder
    createdAt?: SortOrder
    _count?: SavedCarCountOrderByAggregateInput
    _max?: SavedCarMaxOrderByAggregateInput
    _min?: SavedCarMinOrderByAggregateInput
  }

  export type SavedCarScalarWhereWithAggregatesInput = {
    AND?: SavedCarScalarWhereWithAggregatesInput | SavedCarScalarWhereWithAggregatesInput[]
    OR?: SavedCarScalarWhereWithAggregatesInput[]
    NOT?: SavedCarScalarWhereWithAggregatesInput | SavedCarScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SavedCar"> | string
    userId?: StringWithAggregatesFilter<"SavedCar"> | string
    carId?: StringWithAggregatesFilter<"SavedCar"> | string
    createdAt?: DateTimeWithAggregatesFilter<"SavedCar"> | Date | string
  }

  export type TestDriveWhereInput = {
    AND?: TestDriveWhereInput | TestDriveWhereInput[]
    OR?: TestDriveWhereInput[]
    NOT?: TestDriveWhereInput | TestDriveWhereInput[]
    id?: StringFilter<"TestDrive"> | string
    status?: EnumTestDriveStatusFilter<"TestDrive"> | $Enums.TestDriveStatus
    date?: DateTimeFilter<"TestDrive"> | Date | string
    startTime?: StringFilter<"TestDrive"> | string
    endTime?: StringFilter<"TestDrive"> | string
    notes?: StringNullableFilter<"TestDrive"> | string | null
    userId?: StringFilter<"TestDrive"> | string
    carId?: StringFilter<"TestDrive"> | string
    createdAt?: DateTimeFilter<"TestDrive"> | Date | string
    updatedAt?: DateTimeFilter<"TestDrive"> | Date | string
    car?: XOR<CarScalarRelationFilter, CarWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type TestDriveOrderByWithRelationInput = {
    id?: SortOrder
    status?: SortOrder
    date?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    notes?: SortOrderInput | SortOrder
    userId?: SortOrder
    carId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    car?: CarOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type TestDriveWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TestDriveWhereInput | TestDriveWhereInput[]
    OR?: TestDriveWhereInput[]
    NOT?: TestDriveWhereInput | TestDriveWhereInput[]
    status?: EnumTestDriveStatusFilter<"TestDrive"> | $Enums.TestDriveStatus
    date?: DateTimeFilter<"TestDrive"> | Date | string
    startTime?: StringFilter<"TestDrive"> | string
    endTime?: StringFilter<"TestDrive"> | string
    notes?: StringNullableFilter<"TestDrive"> | string | null
    userId?: StringFilter<"TestDrive"> | string
    carId?: StringFilter<"TestDrive"> | string
    createdAt?: DateTimeFilter<"TestDrive"> | Date | string
    updatedAt?: DateTimeFilter<"TestDrive"> | Date | string
    car?: XOR<CarScalarRelationFilter, CarWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type TestDriveOrderByWithAggregationInput = {
    id?: SortOrder
    status?: SortOrder
    date?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    notes?: SortOrderInput | SortOrder
    userId?: SortOrder
    carId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TestDriveCountOrderByAggregateInput
    _max?: TestDriveMaxOrderByAggregateInput
    _min?: TestDriveMinOrderByAggregateInput
  }

  export type TestDriveScalarWhereWithAggregatesInput = {
    AND?: TestDriveScalarWhereWithAggregatesInput | TestDriveScalarWhereWithAggregatesInput[]
    OR?: TestDriveScalarWhereWithAggregatesInput[]
    NOT?: TestDriveScalarWhereWithAggregatesInput | TestDriveScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TestDrive"> | string
    status?: EnumTestDriveStatusWithAggregatesFilter<"TestDrive"> | $Enums.TestDriveStatus
    date?: DateTimeWithAggregatesFilter<"TestDrive"> | Date | string
    startTime?: StringWithAggregatesFilter<"TestDrive"> | string
    endTime?: StringWithAggregatesFilter<"TestDrive"> | string
    notes?: StringNullableWithAggregatesFilter<"TestDrive"> | string | null
    userId?: StringWithAggregatesFilter<"TestDrive"> | string
    carId?: StringWithAggregatesFilter<"TestDrive"> | string
    createdAt?: DateTimeWithAggregatesFilter<"TestDrive"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TestDrive"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    clerkId: string
    email: string
    name?: string | null
    imageUrl?: string | null
    phone?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.UserRole
    savedCars?: SavedCarCreateNestedManyWithoutUserInput
    testDrives?: TestDriveCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    clerkId: string
    email: string
    name?: string | null
    imageUrl?: string | null
    phone?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.UserRole
    savedCars?: SavedCarUncheckedCreateNestedManyWithoutUserInput
    testDrives?: TestDriveUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clerkId?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    savedCars?: SavedCarUpdateManyWithoutUserNestedInput
    testDrives?: TestDriveUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clerkId?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    savedCars?: SavedCarUncheckedUpdateManyWithoutUserNestedInput
    testDrives?: TestDriveUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    clerkId: string
    email: string
    name?: string | null
    imageUrl?: string | null
    phone?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.UserRole
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    clerkId?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    clerkId?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
  }

  export type CarCreateInput = {
    id?: string
    make: string
    model: string
    year: number
    price: Decimal | DecimalJsLike | number | string
    mileage: number
    fuelType: string
    transmission: string
    color: string
    seats?: number | null
    bodyType: string
    featured?: boolean
    status?: $Enums.CarStatus
    images?: CarCreateimagesInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    title?: string | null
    description?: string | null
    location?: string | null
    features?: CarCreatefeaturesInput | string[]
    savedBy?: SavedCarCreateNestedManyWithoutCarInput
    testDrive?: TestDriveCreateNestedManyWithoutCarInput
  }

  export type CarUncheckedCreateInput = {
    id?: string
    make: string
    model: string
    year: number
    price: Decimal | DecimalJsLike | number | string
    mileage: number
    fuelType: string
    transmission: string
    color: string
    seats?: number | null
    bodyType: string
    featured?: boolean
    status?: $Enums.CarStatus
    images?: CarCreateimagesInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    title?: string | null
    description?: string | null
    location?: string | null
    features?: CarCreatefeaturesInput | string[]
    savedBy?: SavedCarUncheckedCreateNestedManyWithoutCarInput
    testDrive?: TestDriveUncheckedCreateNestedManyWithoutCarInput
  }

  export type CarUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    make?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    mileage?: IntFieldUpdateOperationsInput | number
    fuelType?: StringFieldUpdateOperationsInput | string
    transmission?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    seats?: NullableIntFieldUpdateOperationsInput | number | null
    bodyType?: StringFieldUpdateOperationsInput | string
    featured?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumCarStatusFieldUpdateOperationsInput | $Enums.CarStatus
    images?: CarUpdateimagesInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    features?: CarUpdatefeaturesInput | string[]
    savedBy?: SavedCarUpdateManyWithoutCarNestedInput
    testDrive?: TestDriveUpdateManyWithoutCarNestedInput
  }

  export type CarUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    make?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    mileage?: IntFieldUpdateOperationsInput | number
    fuelType?: StringFieldUpdateOperationsInput | string
    transmission?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    seats?: NullableIntFieldUpdateOperationsInput | number | null
    bodyType?: StringFieldUpdateOperationsInput | string
    featured?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumCarStatusFieldUpdateOperationsInput | $Enums.CarStatus
    images?: CarUpdateimagesInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    features?: CarUpdatefeaturesInput | string[]
    savedBy?: SavedCarUncheckedUpdateManyWithoutCarNestedInput
    testDrive?: TestDriveUncheckedUpdateManyWithoutCarNestedInput
  }

  export type CarCreateManyInput = {
    id?: string
    make: string
    model: string
    year: number
    price: Decimal | DecimalJsLike | number | string
    mileage: number
    fuelType: string
    transmission: string
    color: string
    seats?: number | null
    bodyType: string
    featured?: boolean
    status?: $Enums.CarStatus
    images?: CarCreateimagesInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    title?: string | null
    description?: string | null
    location?: string | null
    features?: CarCreatefeaturesInput | string[]
  }

  export type CarUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    make?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    mileage?: IntFieldUpdateOperationsInput | number
    fuelType?: StringFieldUpdateOperationsInput | string
    transmission?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    seats?: NullableIntFieldUpdateOperationsInput | number | null
    bodyType?: StringFieldUpdateOperationsInput | string
    featured?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumCarStatusFieldUpdateOperationsInput | $Enums.CarStatus
    images?: CarUpdateimagesInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    features?: CarUpdatefeaturesInput | string[]
  }

  export type CarUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    make?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    mileage?: IntFieldUpdateOperationsInput | number
    fuelType?: StringFieldUpdateOperationsInput | string
    transmission?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    seats?: NullableIntFieldUpdateOperationsInput | number | null
    bodyType?: StringFieldUpdateOperationsInput | string
    featured?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumCarStatusFieldUpdateOperationsInput | $Enums.CarStatus
    images?: CarUpdateimagesInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    features?: CarUpdatefeaturesInput | string[]
  }

  export type DealershipCreateInput = {
    id?: string
    name?: string
    address?: string
    phone?: string
    email?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    workingHours?: WorkingHoursCreateNestedManyWithoutDealershipInput
  }

  export type DealershipUncheckedCreateInput = {
    id?: string
    name?: string
    address?: string
    phone?: string
    email?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    workingHours?: WorkingHoursUncheckedCreateNestedManyWithoutDealershipInput
  }

  export type DealershipUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    workingHours?: WorkingHoursUpdateManyWithoutDealershipNestedInput
  }

  export type DealershipUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    workingHours?: WorkingHoursUncheckedUpdateManyWithoutDealershipNestedInput
  }

  export type DealershipCreateManyInput = {
    id?: string
    name?: string
    address?: string
    phone?: string
    email?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DealershipUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DealershipUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkingHoursCreateInput = {
    id?: string
    dayOfWeek?: WorkingHoursCreatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime: string
    closeTime: string
    isOpen?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    dealership: DealershipCreateNestedOneWithoutWorkingHoursInput
  }

  export type WorkingHoursUncheckedCreateInput = {
    id?: string
    dayOfWeek?: WorkingHoursCreatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime: string
    closeTime: string
    isOpen?: boolean
    dealershipId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkingHoursUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    dayOfWeek?: WorkingHoursUpdatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime?: StringFieldUpdateOperationsInput | string
    closeTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dealership?: DealershipUpdateOneRequiredWithoutWorkingHoursNestedInput
  }

  export type WorkingHoursUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    dayOfWeek?: WorkingHoursUpdatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime?: StringFieldUpdateOperationsInput | string
    closeTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
    dealershipId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkingHoursCreateManyInput = {
    id?: string
    dayOfWeek?: WorkingHoursCreatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime: string
    closeTime: string
    isOpen?: boolean
    dealershipId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkingHoursUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    dayOfWeek?: WorkingHoursUpdatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime?: StringFieldUpdateOperationsInput | string
    closeTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkingHoursUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    dayOfWeek?: WorkingHoursUpdatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime?: StringFieldUpdateOperationsInput | string
    closeTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
    dealershipId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SavedCarCreateInput = {
    id?: string
    createdAt?: Date | string
    car: CarCreateNestedOneWithoutSavedByInput
    user: UserCreateNestedOneWithoutSavedCarsInput
  }

  export type SavedCarUncheckedCreateInput = {
    id?: string
    userId: string
    carId: string
    createdAt?: Date | string
  }

  export type SavedCarUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    car?: CarUpdateOneRequiredWithoutSavedByNestedInput
    user?: UserUpdateOneRequiredWithoutSavedCarsNestedInput
  }

  export type SavedCarUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    carId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SavedCarCreateManyInput = {
    id?: string
    userId: string
    carId: string
    createdAt?: Date | string
  }

  export type SavedCarUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SavedCarUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    carId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestDriveCreateInput = {
    id?: string
    status?: $Enums.TestDriveStatus
    date: Date | string
    startTime: string
    endTime: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    car: CarCreateNestedOneWithoutTestDriveInput
    user: UserCreateNestedOneWithoutTestDrivesInput
  }

  export type TestDriveUncheckedCreateInput = {
    id?: string
    status?: $Enums.TestDriveStatus
    date: Date | string
    startTime: string
    endTime: string
    notes?: string | null
    userId: string
    carId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TestDriveUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumTestDriveStatusFieldUpdateOperationsInput | $Enums.TestDriveStatus
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    car?: CarUpdateOneRequiredWithoutTestDriveNestedInput
    user?: UserUpdateOneRequiredWithoutTestDrivesNestedInput
  }

  export type TestDriveUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumTestDriveStatusFieldUpdateOperationsInput | $Enums.TestDriveStatus
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    carId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestDriveCreateManyInput = {
    id?: string
    status?: $Enums.TestDriveStatus
    date: Date | string
    startTime: string
    endTime: string
    notes?: string | null
    userId: string
    carId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TestDriveUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumTestDriveStatusFieldUpdateOperationsInput | $Enums.TestDriveStatus
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestDriveUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumTestDriveStatusFieldUpdateOperationsInput | $Enums.TestDriveStatus
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    carId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type EnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type SavedCarListRelationFilter = {
    every?: SavedCarWhereInput
    some?: SavedCarWhereInput
    none?: SavedCarWhereInput
  }

  export type TestDriveListRelationFilter = {
    every?: TestDriveWhereInput
    some?: TestDriveWhereInput
    none?: TestDriveWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type SavedCarOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TestDriveOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    clerkId?: SortOrder
    email?: SortOrder
    name?: SortOrder
    imageUrl?: SortOrder
    phone?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    role?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    clerkId?: SortOrder
    email?: SortOrder
    name?: SortOrder
    imageUrl?: SortOrder
    phone?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    role?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    clerkId?: SortOrder
    email?: SortOrder
    name?: SortOrder
    imageUrl?: SortOrder
    phone?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    role?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type EnumCarStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CarStatus | EnumCarStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CarStatus[] | ListEnumCarStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CarStatus[] | ListEnumCarStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCarStatusFilter<$PrismaModel> | $Enums.CarStatus
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type CarCountOrderByAggregateInput = {
    id?: SortOrder
    make?: SortOrder
    model?: SortOrder
    year?: SortOrder
    price?: SortOrder
    mileage?: SortOrder
    fuelType?: SortOrder
    transmission?: SortOrder
    color?: SortOrder
    seats?: SortOrder
    bodyType?: SortOrder
    featured?: SortOrder
    status?: SortOrder
    images?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    title?: SortOrder
    description?: SortOrder
    location?: SortOrder
    features?: SortOrder
  }

  export type CarAvgOrderByAggregateInput = {
    year?: SortOrder
    price?: SortOrder
    mileage?: SortOrder
    seats?: SortOrder
  }

  export type CarMaxOrderByAggregateInput = {
    id?: SortOrder
    make?: SortOrder
    model?: SortOrder
    year?: SortOrder
    price?: SortOrder
    mileage?: SortOrder
    fuelType?: SortOrder
    transmission?: SortOrder
    color?: SortOrder
    seats?: SortOrder
    bodyType?: SortOrder
    featured?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    title?: SortOrder
    description?: SortOrder
    location?: SortOrder
  }

  export type CarMinOrderByAggregateInput = {
    id?: SortOrder
    make?: SortOrder
    model?: SortOrder
    year?: SortOrder
    price?: SortOrder
    mileage?: SortOrder
    fuelType?: SortOrder
    transmission?: SortOrder
    color?: SortOrder
    seats?: SortOrder
    bodyType?: SortOrder
    featured?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    title?: SortOrder
    description?: SortOrder
    location?: SortOrder
  }

  export type CarSumOrderByAggregateInput = {
    year?: SortOrder
    price?: SortOrder
    mileage?: SortOrder
    seats?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumCarStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CarStatus | EnumCarStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CarStatus[] | ListEnumCarStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CarStatus[] | ListEnumCarStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCarStatusWithAggregatesFilter<$PrismaModel> | $Enums.CarStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCarStatusFilter<$PrismaModel>
    _max?: NestedEnumCarStatusFilter<$PrismaModel>
  }

  export type WorkingHoursListRelationFilter = {
    every?: WorkingHoursWhereInput
    some?: WorkingHoursWhereInput
    none?: WorkingHoursWhereInput
  }

  export type WorkingHoursOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type DealershipCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    address?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DealershipMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    address?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DealershipMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    address?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumDayOfWeekNullableListFilter<$PrismaModel = never> = {
    equals?: $Enums.DayOfWeek[] | ListEnumDayOfWeekFieldRefInput<$PrismaModel> | null
    has?: $Enums.DayOfWeek | EnumDayOfWeekFieldRefInput<$PrismaModel> | null
    hasEvery?: $Enums.DayOfWeek[] | ListEnumDayOfWeekFieldRefInput<$PrismaModel>
    hasSome?: $Enums.DayOfWeek[] | ListEnumDayOfWeekFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type DealershipScalarRelationFilter = {
    is?: DealershipWhereInput
    isNot?: DealershipWhereInput
  }

  export type WorkingHoursDayOfWeekDealershipIdCompoundUniqueInput = {
    dayOfWeek: $Enums.DayOfWeek[]
    dealershipId: string
  }

  export type WorkingHoursCountOrderByAggregateInput = {
    id?: SortOrder
    dayOfWeek?: SortOrder
    openTime?: SortOrder
    closeTime?: SortOrder
    isOpen?: SortOrder
    dealershipId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkingHoursMaxOrderByAggregateInput = {
    id?: SortOrder
    openTime?: SortOrder
    closeTime?: SortOrder
    isOpen?: SortOrder
    dealershipId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkingHoursMinOrderByAggregateInput = {
    id?: SortOrder
    openTime?: SortOrder
    closeTime?: SortOrder
    isOpen?: SortOrder
    dealershipId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CarScalarRelationFilter = {
    is?: CarWhereInput
    isNot?: CarWhereInput
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type SavedCarUserIdCarIdCompoundUniqueInput = {
    userId: string
    carId: string
  }

  export type SavedCarCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    carId?: SortOrder
    createdAt?: SortOrder
  }

  export type SavedCarMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    carId?: SortOrder
    createdAt?: SortOrder
  }

  export type SavedCarMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    carId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumTestDriveStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TestDriveStatus | EnumTestDriveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TestDriveStatus[] | ListEnumTestDriveStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TestDriveStatus[] | ListEnumTestDriveStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTestDriveStatusFilter<$PrismaModel> | $Enums.TestDriveStatus
  }

  export type TestDriveCountOrderByAggregateInput = {
    id?: SortOrder
    status?: SortOrder
    date?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    notes?: SortOrder
    userId?: SortOrder
    carId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TestDriveMaxOrderByAggregateInput = {
    id?: SortOrder
    status?: SortOrder
    date?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    notes?: SortOrder
    userId?: SortOrder
    carId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TestDriveMinOrderByAggregateInput = {
    id?: SortOrder
    status?: SortOrder
    date?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    notes?: SortOrder
    userId?: SortOrder
    carId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumTestDriveStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TestDriveStatus | EnumTestDriveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TestDriveStatus[] | ListEnumTestDriveStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TestDriveStatus[] | ListEnumTestDriveStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTestDriveStatusWithAggregatesFilter<$PrismaModel> | $Enums.TestDriveStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTestDriveStatusFilter<$PrismaModel>
    _max?: NestedEnumTestDriveStatusFilter<$PrismaModel>
  }

  export type SavedCarCreateNestedManyWithoutUserInput = {
    create?: XOR<SavedCarCreateWithoutUserInput, SavedCarUncheckedCreateWithoutUserInput> | SavedCarCreateWithoutUserInput[] | SavedCarUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SavedCarCreateOrConnectWithoutUserInput | SavedCarCreateOrConnectWithoutUserInput[]
    createMany?: SavedCarCreateManyUserInputEnvelope
    connect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
  }

  export type TestDriveCreateNestedManyWithoutUserInput = {
    create?: XOR<TestDriveCreateWithoutUserInput, TestDriveUncheckedCreateWithoutUserInput> | TestDriveCreateWithoutUserInput[] | TestDriveUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TestDriveCreateOrConnectWithoutUserInput | TestDriveCreateOrConnectWithoutUserInput[]
    createMany?: TestDriveCreateManyUserInputEnvelope
    connect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
  }

  export type SavedCarUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SavedCarCreateWithoutUserInput, SavedCarUncheckedCreateWithoutUserInput> | SavedCarCreateWithoutUserInput[] | SavedCarUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SavedCarCreateOrConnectWithoutUserInput | SavedCarCreateOrConnectWithoutUserInput[]
    createMany?: SavedCarCreateManyUserInputEnvelope
    connect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
  }

  export type TestDriveUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<TestDriveCreateWithoutUserInput, TestDriveUncheckedCreateWithoutUserInput> | TestDriveCreateWithoutUserInput[] | TestDriveUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TestDriveCreateOrConnectWithoutUserInput | TestDriveCreateOrConnectWithoutUserInput[]
    createMany?: TestDriveCreateManyUserInputEnvelope
    connect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EnumUserRoleFieldUpdateOperationsInput = {
    set?: $Enums.UserRole
  }

  export type SavedCarUpdateManyWithoutUserNestedInput = {
    create?: XOR<SavedCarCreateWithoutUserInput, SavedCarUncheckedCreateWithoutUserInput> | SavedCarCreateWithoutUserInput[] | SavedCarUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SavedCarCreateOrConnectWithoutUserInput | SavedCarCreateOrConnectWithoutUserInput[]
    upsert?: SavedCarUpsertWithWhereUniqueWithoutUserInput | SavedCarUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SavedCarCreateManyUserInputEnvelope
    set?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    disconnect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    delete?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    connect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    update?: SavedCarUpdateWithWhereUniqueWithoutUserInput | SavedCarUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SavedCarUpdateManyWithWhereWithoutUserInput | SavedCarUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SavedCarScalarWhereInput | SavedCarScalarWhereInput[]
  }

  export type TestDriveUpdateManyWithoutUserNestedInput = {
    create?: XOR<TestDriveCreateWithoutUserInput, TestDriveUncheckedCreateWithoutUserInput> | TestDriveCreateWithoutUserInput[] | TestDriveUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TestDriveCreateOrConnectWithoutUserInput | TestDriveCreateOrConnectWithoutUserInput[]
    upsert?: TestDriveUpsertWithWhereUniqueWithoutUserInput | TestDriveUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TestDriveCreateManyUserInputEnvelope
    set?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    disconnect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    delete?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    connect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    update?: TestDriveUpdateWithWhereUniqueWithoutUserInput | TestDriveUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TestDriveUpdateManyWithWhereWithoutUserInput | TestDriveUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TestDriveScalarWhereInput | TestDriveScalarWhereInput[]
  }

  export type SavedCarUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SavedCarCreateWithoutUserInput, SavedCarUncheckedCreateWithoutUserInput> | SavedCarCreateWithoutUserInput[] | SavedCarUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SavedCarCreateOrConnectWithoutUserInput | SavedCarCreateOrConnectWithoutUserInput[]
    upsert?: SavedCarUpsertWithWhereUniqueWithoutUserInput | SavedCarUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SavedCarCreateManyUserInputEnvelope
    set?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    disconnect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    delete?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    connect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    update?: SavedCarUpdateWithWhereUniqueWithoutUserInput | SavedCarUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SavedCarUpdateManyWithWhereWithoutUserInput | SavedCarUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SavedCarScalarWhereInput | SavedCarScalarWhereInput[]
  }

  export type TestDriveUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<TestDriveCreateWithoutUserInput, TestDriveUncheckedCreateWithoutUserInput> | TestDriveCreateWithoutUserInput[] | TestDriveUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TestDriveCreateOrConnectWithoutUserInput | TestDriveCreateOrConnectWithoutUserInput[]
    upsert?: TestDriveUpsertWithWhereUniqueWithoutUserInput | TestDriveUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TestDriveCreateManyUserInputEnvelope
    set?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    disconnect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    delete?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    connect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    update?: TestDriveUpdateWithWhereUniqueWithoutUserInput | TestDriveUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TestDriveUpdateManyWithWhereWithoutUserInput | TestDriveUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TestDriveScalarWhereInput | TestDriveScalarWhereInput[]
  }

  export type CarCreateimagesInput = {
    set: string[]
  }

  export type CarCreatefeaturesInput = {
    set: string[]
  }

  export type SavedCarCreateNestedManyWithoutCarInput = {
    create?: XOR<SavedCarCreateWithoutCarInput, SavedCarUncheckedCreateWithoutCarInput> | SavedCarCreateWithoutCarInput[] | SavedCarUncheckedCreateWithoutCarInput[]
    connectOrCreate?: SavedCarCreateOrConnectWithoutCarInput | SavedCarCreateOrConnectWithoutCarInput[]
    createMany?: SavedCarCreateManyCarInputEnvelope
    connect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
  }

  export type TestDriveCreateNestedManyWithoutCarInput = {
    create?: XOR<TestDriveCreateWithoutCarInput, TestDriveUncheckedCreateWithoutCarInput> | TestDriveCreateWithoutCarInput[] | TestDriveUncheckedCreateWithoutCarInput[]
    connectOrCreate?: TestDriveCreateOrConnectWithoutCarInput | TestDriveCreateOrConnectWithoutCarInput[]
    createMany?: TestDriveCreateManyCarInputEnvelope
    connect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
  }

  export type SavedCarUncheckedCreateNestedManyWithoutCarInput = {
    create?: XOR<SavedCarCreateWithoutCarInput, SavedCarUncheckedCreateWithoutCarInput> | SavedCarCreateWithoutCarInput[] | SavedCarUncheckedCreateWithoutCarInput[]
    connectOrCreate?: SavedCarCreateOrConnectWithoutCarInput | SavedCarCreateOrConnectWithoutCarInput[]
    createMany?: SavedCarCreateManyCarInputEnvelope
    connect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
  }

  export type TestDriveUncheckedCreateNestedManyWithoutCarInput = {
    create?: XOR<TestDriveCreateWithoutCarInput, TestDriveUncheckedCreateWithoutCarInput> | TestDriveCreateWithoutCarInput[] | TestDriveUncheckedCreateWithoutCarInput[]
    connectOrCreate?: TestDriveCreateOrConnectWithoutCarInput | TestDriveCreateOrConnectWithoutCarInput[]
    createMany?: TestDriveCreateManyCarInputEnvelope
    connect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type EnumCarStatusFieldUpdateOperationsInput = {
    set?: $Enums.CarStatus
  }

  export type CarUpdateimagesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type CarUpdatefeaturesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type SavedCarUpdateManyWithoutCarNestedInput = {
    create?: XOR<SavedCarCreateWithoutCarInput, SavedCarUncheckedCreateWithoutCarInput> | SavedCarCreateWithoutCarInput[] | SavedCarUncheckedCreateWithoutCarInput[]
    connectOrCreate?: SavedCarCreateOrConnectWithoutCarInput | SavedCarCreateOrConnectWithoutCarInput[]
    upsert?: SavedCarUpsertWithWhereUniqueWithoutCarInput | SavedCarUpsertWithWhereUniqueWithoutCarInput[]
    createMany?: SavedCarCreateManyCarInputEnvelope
    set?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    disconnect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    delete?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    connect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    update?: SavedCarUpdateWithWhereUniqueWithoutCarInput | SavedCarUpdateWithWhereUniqueWithoutCarInput[]
    updateMany?: SavedCarUpdateManyWithWhereWithoutCarInput | SavedCarUpdateManyWithWhereWithoutCarInput[]
    deleteMany?: SavedCarScalarWhereInput | SavedCarScalarWhereInput[]
  }

  export type TestDriveUpdateManyWithoutCarNestedInput = {
    create?: XOR<TestDriveCreateWithoutCarInput, TestDriveUncheckedCreateWithoutCarInput> | TestDriveCreateWithoutCarInput[] | TestDriveUncheckedCreateWithoutCarInput[]
    connectOrCreate?: TestDriveCreateOrConnectWithoutCarInput | TestDriveCreateOrConnectWithoutCarInput[]
    upsert?: TestDriveUpsertWithWhereUniqueWithoutCarInput | TestDriveUpsertWithWhereUniqueWithoutCarInput[]
    createMany?: TestDriveCreateManyCarInputEnvelope
    set?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    disconnect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    delete?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    connect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    update?: TestDriveUpdateWithWhereUniqueWithoutCarInput | TestDriveUpdateWithWhereUniqueWithoutCarInput[]
    updateMany?: TestDriveUpdateManyWithWhereWithoutCarInput | TestDriveUpdateManyWithWhereWithoutCarInput[]
    deleteMany?: TestDriveScalarWhereInput | TestDriveScalarWhereInput[]
  }

  export type SavedCarUncheckedUpdateManyWithoutCarNestedInput = {
    create?: XOR<SavedCarCreateWithoutCarInput, SavedCarUncheckedCreateWithoutCarInput> | SavedCarCreateWithoutCarInput[] | SavedCarUncheckedCreateWithoutCarInput[]
    connectOrCreate?: SavedCarCreateOrConnectWithoutCarInput | SavedCarCreateOrConnectWithoutCarInput[]
    upsert?: SavedCarUpsertWithWhereUniqueWithoutCarInput | SavedCarUpsertWithWhereUniqueWithoutCarInput[]
    createMany?: SavedCarCreateManyCarInputEnvelope
    set?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    disconnect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    delete?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    connect?: SavedCarWhereUniqueInput | SavedCarWhereUniqueInput[]
    update?: SavedCarUpdateWithWhereUniqueWithoutCarInput | SavedCarUpdateWithWhereUniqueWithoutCarInput[]
    updateMany?: SavedCarUpdateManyWithWhereWithoutCarInput | SavedCarUpdateManyWithWhereWithoutCarInput[]
    deleteMany?: SavedCarScalarWhereInput | SavedCarScalarWhereInput[]
  }

  export type TestDriveUncheckedUpdateManyWithoutCarNestedInput = {
    create?: XOR<TestDriveCreateWithoutCarInput, TestDriveUncheckedCreateWithoutCarInput> | TestDriveCreateWithoutCarInput[] | TestDriveUncheckedCreateWithoutCarInput[]
    connectOrCreate?: TestDriveCreateOrConnectWithoutCarInput | TestDriveCreateOrConnectWithoutCarInput[]
    upsert?: TestDriveUpsertWithWhereUniqueWithoutCarInput | TestDriveUpsertWithWhereUniqueWithoutCarInput[]
    createMany?: TestDriveCreateManyCarInputEnvelope
    set?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    disconnect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    delete?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    connect?: TestDriveWhereUniqueInput | TestDriveWhereUniqueInput[]
    update?: TestDriveUpdateWithWhereUniqueWithoutCarInput | TestDriveUpdateWithWhereUniqueWithoutCarInput[]
    updateMany?: TestDriveUpdateManyWithWhereWithoutCarInput | TestDriveUpdateManyWithWhereWithoutCarInput[]
    deleteMany?: TestDriveScalarWhereInput | TestDriveScalarWhereInput[]
  }

  export type WorkingHoursCreateNestedManyWithoutDealershipInput = {
    create?: XOR<WorkingHoursCreateWithoutDealershipInput, WorkingHoursUncheckedCreateWithoutDealershipInput> | WorkingHoursCreateWithoutDealershipInput[] | WorkingHoursUncheckedCreateWithoutDealershipInput[]
    connectOrCreate?: WorkingHoursCreateOrConnectWithoutDealershipInput | WorkingHoursCreateOrConnectWithoutDealershipInput[]
    createMany?: WorkingHoursCreateManyDealershipInputEnvelope
    connect?: WorkingHoursWhereUniqueInput | WorkingHoursWhereUniqueInput[]
  }

  export type WorkingHoursUncheckedCreateNestedManyWithoutDealershipInput = {
    create?: XOR<WorkingHoursCreateWithoutDealershipInput, WorkingHoursUncheckedCreateWithoutDealershipInput> | WorkingHoursCreateWithoutDealershipInput[] | WorkingHoursUncheckedCreateWithoutDealershipInput[]
    connectOrCreate?: WorkingHoursCreateOrConnectWithoutDealershipInput | WorkingHoursCreateOrConnectWithoutDealershipInput[]
    createMany?: WorkingHoursCreateManyDealershipInputEnvelope
    connect?: WorkingHoursWhereUniqueInput | WorkingHoursWhereUniqueInput[]
  }

  export type WorkingHoursUpdateManyWithoutDealershipNestedInput = {
    create?: XOR<WorkingHoursCreateWithoutDealershipInput, WorkingHoursUncheckedCreateWithoutDealershipInput> | WorkingHoursCreateWithoutDealershipInput[] | WorkingHoursUncheckedCreateWithoutDealershipInput[]
    connectOrCreate?: WorkingHoursCreateOrConnectWithoutDealershipInput | WorkingHoursCreateOrConnectWithoutDealershipInput[]
    upsert?: WorkingHoursUpsertWithWhereUniqueWithoutDealershipInput | WorkingHoursUpsertWithWhereUniqueWithoutDealershipInput[]
    createMany?: WorkingHoursCreateManyDealershipInputEnvelope
    set?: WorkingHoursWhereUniqueInput | WorkingHoursWhereUniqueInput[]
    disconnect?: WorkingHoursWhereUniqueInput | WorkingHoursWhereUniqueInput[]
    delete?: WorkingHoursWhereUniqueInput | WorkingHoursWhereUniqueInput[]
    connect?: WorkingHoursWhereUniqueInput | WorkingHoursWhereUniqueInput[]
    update?: WorkingHoursUpdateWithWhereUniqueWithoutDealershipInput | WorkingHoursUpdateWithWhereUniqueWithoutDealershipInput[]
    updateMany?: WorkingHoursUpdateManyWithWhereWithoutDealershipInput | WorkingHoursUpdateManyWithWhereWithoutDealershipInput[]
    deleteMany?: WorkingHoursScalarWhereInput | WorkingHoursScalarWhereInput[]
  }

  export type WorkingHoursUncheckedUpdateManyWithoutDealershipNestedInput = {
    create?: XOR<WorkingHoursCreateWithoutDealershipInput, WorkingHoursUncheckedCreateWithoutDealershipInput> | WorkingHoursCreateWithoutDealershipInput[] | WorkingHoursUncheckedCreateWithoutDealershipInput[]
    connectOrCreate?: WorkingHoursCreateOrConnectWithoutDealershipInput | WorkingHoursCreateOrConnectWithoutDealershipInput[]
    upsert?: WorkingHoursUpsertWithWhereUniqueWithoutDealershipInput | WorkingHoursUpsertWithWhereUniqueWithoutDealershipInput[]
    createMany?: WorkingHoursCreateManyDealershipInputEnvelope
    set?: WorkingHoursWhereUniqueInput | WorkingHoursWhereUniqueInput[]
    disconnect?: WorkingHoursWhereUniqueInput | WorkingHoursWhereUniqueInput[]
    delete?: WorkingHoursWhereUniqueInput | WorkingHoursWhereUniqueInput[]
    connect?: WorkingHoursWhereUniqueInput | WorkingHoursWhereUniqueInput[]
    update?: WorkingHoursUpdateWithWhereUniqueWithoutDealershipInput | WorkingHoursUpdateWithWhereUniqueWithoutDealershipInput[]
    updateMany?: WorkingHoursUpdateManyWithWhereWithoutDealershipInput | WorkingHoursUpdateManyWithWhereWithoutDealershipInput[]
    deleteMany?: WorkingHoursScalarWhereInput | WorkingHoursScalarWhereInput[]
  }

  export type WorkingHoursCreatedayOfWeekInput = {
    set: $Enums.DayOfWeek[]
  }

  export type DealershipCreateNestedOneWithoutWorkingHoursInput = {
    create?: XOR<DealershipCreateWithoutWorkingHoursInput, DealershipUncheckedCreateWithoutWorkingHoursInput>
    connectOrCreate?: DealershipCreateOrConnectWithoutWorkingHoursInput
    connect?: DealershipWhereUniqueInput
  }

  export type WorkingHoursUpdatedayOfWeekInput = {
    set?: $Enums.DayOfWeek[]
    push?: $Enums.DayOfWeek | $Enums.DayOfWeek[]
  }

  export type DealershipUpdateOneRequiredWithoutWorkingHoursNestedInput = {
    create?: XOR<DealershipCreateWithoutWorkingHoursInput, DealershipUncheckedCreateWithoutWorkingHoursInput>
    connectOrCreate?: DealershipCreateOrConnectWithoutWorkingHoursInput
    upsert?: DealershipUpsertWithoutWorkingHoursInput
    connect?: DealershipWhereUniqueInput
    update?: XOR<XOR<DealershipUpdateToOneWithWhereWithoutWorkingHoursInput, DealershipUpdateWithoutWorkingHoursInput>, DealershipUncheckedUpdateWithoutWorkingHoursInput>
  }

  export type CarCreateNestedOneWithoutSavedByInput = {
    create?: XOR<CarCreateWithoutSavedByInput, CarUncheckedCreateWithoutSavedByInput>
    connectOrCreate?: CarCreateOrConnectWithoutSavedByInput
    connect?: CarWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutSavedCarsInput = {
    create?: XOR<UserCreateWithoutSavedCarsInput, UserUncheckedCreateWithoutSavedCarsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSavedCarsInput
    connect?: UserWhereUniqueInput
  }

  export type CarUpdateOneRequiredWithoutSavedByNestedInput = {
    create?: XOR<CarCreateWithoutSavedByInput, CarUncheckedCreateWithoutSavedByInput>
    connectOrCreate?: CarCreateOrConnectWithoutSavedByInput
    upsert?: CarUpsertWithoutSavedByInput
    connect?: CarWhereUniqueInput
    update?: XOR<XOR<CarUpdateToOneWithWhereWithoutSavedByInput, CarUpdateWithoutSavedByInput>, CarUncheckedUpdateWithoutSavedByInput>
  }

  export type UserUpdateOneRequiredWithoutSavedCarsNestedInput = {
    create?: XOR<UserCreateWithoutSavedCarsInput, UserUncheckedCreateWithoutSavedCarsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSavedCarsInput
    upsert?: UserUpsertWithoutSavedCarsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSavedCarsInput, UserUpdateWithoutSavedCarsInput>, UserUncheckedUpdateWithoutSavedCarsInput>
  }

  export type CarCreateNestedOneWithoutTestDriveInput = {
    create?: XOR<CarCreateWithoutTestDriveInput, CarUncheckedCreateWithoutTestDriveInput>
    connectOrCreate?: CarCreateOrConnectWithoutTestDriveInput
    connect?: CarWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutTestDrivesInput = {
    create?: XOR<UserCreateWithoutTestDrivesInput, UserUncheckedCreateWithoutTestDrivesInput>
    connectOrCreate?: UserCreateOrConnectWithoutTestDrivesInput
    connect?: UserWhereUniqueInput
  }

  export type EnumTestDriveStatusFieldUpdateOperationsInput = {
    set?: $Enums.TestDriveStatus
  }

  export type CarUpdateOneRequiredWithoutTestDriveNestedInput = {
    create?: XOR<CarCreateWithoutTestDriveInput, CarUncheckedCreateWithoutTestDriveInput>
    connectOrCreate?: CarCreateOrConnectWithoutTestDriveInput
    upsert?: CarUpsertWithoutTestDriveInput
    connect?: CarWhereUniqueInput
    update?: XOR<XOR<CarUpdateToOneWithWhereWithoutTestDriveInput, CarUpdateWithoutTestDriveInput>, CarUncheckedUpdateWithoutTestDriveInput>
  }

  export type UserUpdateOneRequiredWithoutTestDrivesNestedInput = {
    create?: XOR<UserCreateWithoutTestDrivesInput, UserUncheckedCreateWithoutTestDrivesInput>
    connectOrCreate?: UserCreateOrConnectWithoutTestDrivesInput
    upsert?: UserUpsertWithoutTestDrivesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutTestDrivesInput, UserUpdateWithoutTestDrivesInput>, UserUncheckedUpdateWithoutTestDrivesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedEnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumCarStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CarStatus | EnumCarStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CarStatus[] | ListEnumCarStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CarStatus[] | ListEnumCarStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCarStatusFilter<$PrismaModel> | $Enums.CarStatus
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumCarStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CarStatus | EnumCarStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CarStatus[] | ListEnumCarStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CarStatus[] | ListEnumCarStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCarStatusWithAggregatesFilter<$PrismaModel> | $Enums.CarStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCarStatusFilter<$PrismaModel>
    _max?: NestedEnumCarStatusFilter<$PrismaModel>
  }

  export type NestedEnumTestDriveStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TestDriveStatus | EnumTestDriveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TestDriveStatus[] | ListEnumTestDriveStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TestDriveStatus[] | ListEnumTestDriveStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTestDriveStatusFilter<$PrismaModel> | $Enums.TestDriveStatus
  }

  export type NestedEnumTestDriveStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TestDriveStatus | EnumTestDriveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TestDriveStatus[] | ListEnumTestDriveStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TestDriveStatus[] | ListEnumTestDriveStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTestDriveStatusWithAggregatesFilter<$PrismaModel> | $Enums.TestDriveStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTestDriveStatusFilter<$PrismaModel>
    _max?: NestedEnumTestDriveStatusFilter<$PrismaModel>
  }

  export type SavedCarCreateWithoutUserInput = {
    id?: string
    createdAt?: Date | string
    car: CarCreateNestedOneWithoutSavedByInput
  }

  export type SavedCarUncheckedCreateWithoutUserInput = {
    id?: string
    carId: string
    createdAt?: Date | string
  }

  export type SavedCarCreateOrConnectWithoutUserInput = {
    where: SavedCarWhereUniqueInput
    create: XOR<SavedCarCreateWithoutUserInput, SavedCarUncheckedCreateWithoutUserInput>
  }

  export type SavedCarCreateManyUserInputEnvelope = {
    data: SavedCarCreateManyUserInput | SavedCarCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type TestDriveCreateWithoutUserInput = {
    id?: string
    status?: $Enums.TestDriveStatus
    date: Date | string
    startTime: string
    endTime: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    car: CarCreateNestedOneWithoutTestDriveInput
  }

  export type TestDriveUncheckedCreateWithoutUserInput = {
    id?: string
    status?: $Enums.TestDriveStatus
    date: Date | string
    startTime: string
    endTime: string
    notes?: string | null
    carId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TestDriveCreateOrConnectWithoutUserInput = {
    where: TestDriveWhereUniqueInput
    create: XOR<TestDriveCreateWithoutUserInput, TestDriveUncheckedCreateWithoutUserInput>
  }

  export type TestDriveCreateManyUserInputEnvelope = {
    data: TestDriveCreateManyUserInput | TestDriveCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SavedCarUpsertWithWhereUniqueWithoutUserInput = {
    where: SavedCarWhereUniqueInput
    update: XOR<SavedCarUpdateWithoutUserInput, SavedCarUncheckedUpdateWithoutUserInput>
    create: XOR<SavedCarCreateWithoutUserInput, SavedCarUncheckedCreateWithoutUserInput>
  }

  export type SavedCarUpdateWithWhereUniqueWithoutUserInput = {
    where: SavedCarWhereUniqueInput
    data: XOR<SavedCarUpdateWithoutUserInput, SavedCarUncheckedUpdateWithoutUserInput>
  }

  export type SavedCarUpdateManyWithWhereWithoutUserInput = {
    where: SavedCarScalarWhereInput
    data: XOR<SavedCarUpdateManyMutationInput, SavedCarUncheckedUpdateManyWithoutUserInput>
  }

  export type SavedCarScalarWhereInput = {
    AND?: SavedCarScalarWhereInput | SavedCarScalarWhereInput[]
    OR?: SavedCarScalarWhereInput[]
    NOT?: SavedCarScalarWhereInput | SavedCarScalarWhereInput[]
    id?: StringFilter<"SavedCar"> | string
    userId?: StringFilter<"SavedCar"> | string
    carId?: StringFilter<"SavedCar"> | string
    createdAt?: DateTimeFilter<"SavedCar"> | Date | string
  }

  export type TestDriveUpsertWithWhereUniqueWithoutUserInput = {
    where: TestDriveWhereUniqueInput
    update: XOR<TestDriveUpdateWithoutUserInput, TestDriveUncheckedUpdateWithoutUserInput>
    create: XOR<TestDriveCreateWithoutUserInput, TestDriveUncheckedCreateWithoutUserInput>
  }

  export type TestDriveUpdateWithWhereUniqueWithoutUserInput = {
    where: TestDriveWhereUniqueInput
    data: XOR<TestDriveUpdateWithoutUserInput, TestDriveUncheckedUpdateWithoutUserInput>
  }

  export type TestDriveUpdateManyWithWhereWithoutUserInput = {
    where: TestDriveScalarWhereInput
    data: XOR<TestDriveUpdateManyMutationInput, TestDriveUncheckedUpdateManyWithoutUserInput>
  }

  export type TestDriveScalarWhereInput = {
    AND?: TestDriveScalarWhereInput | TestDriveScalarWhereInput[]
    OR?: TestDriveScalarWhereInput[]
    NOT?: TestDriveScalarWhereInput | TestDriveScalarWhereInput[]
    id?: StringFilter<"TestDrive"> | string
    status?: EnumTestDriveStatusFilter<"TestDrive"> | $Enums.TestDriveStatus
    date?: DateTimeFilter<"TestDrive"> | Date | string
    startTime?: StringFilter<"TestDrive"> | string
    endTime?: StringFilter<"TestDrive"> | string
    notes?: StringNullableFilter<"TestDrive"> | string | null
    userId?: StringFilter<"TestDrive"> | string
    carId?: StringFilter<"TestDrive"> | string
    createdAt?: DateTimeFilter<"TestDrive"> | Date | string
    updatedAt?: DateTimeFilter<"TestDrive"> | Date | string
  }

  export type SavedCarCreateWithoutCarInput = {
    id?: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutSavedCarsInput
  }

  export type SavedCarUncheckedCreateWithoutCarInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type SavedCarCreateOrConnectWithoutCarInput = {
    where: SavedCarWhereUniqueInput
    create: XOR<SavedCarCreateWithoutCarInput, SavedCarUncheckedCreateWithoutCarInput>
  }

  export type SavedCarCreateManyCarInputEnvelope = {
    data: SavedCarCreateManyCarInput | SavedCarCreateManyCarInput[]
    skipDuplicates?: boolean
  }

  export type TestDriveCreateWithoutCarInput = {
    id?: string
    status?: $Enums.TestDriveStatus
    date: Date | string
    startTime: string
    endTime: string
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutTestDrivesInput
  }

  export type TestDriveUncheckedCreateWithoutCarInput = {
    id?: string
    status?: $Enums.TestDriveStatus
    date: Date | string
    startTime: string
    endTime: string
    notes?: string | null
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TestDriveCreateOrConnectWithoutCarInput = {
    where: TestDriveWhereUniqueInput
    create: XOR<TestDriveCreateWithoutCarInput, TestDriveUncheckedCreateWithoutCarInput>
  }

  export type TestDriveCreateManyCarInputEnvelope = {
    data: TestDriveCreateManyCarInput | TestDriveCreateManyCarInput[]
    skipDuplicates?: boolean
  }

  export type SavedCarUpsertWithWhereUniqueWithoutCarInput = {
    where: SavedCarWhereUniqueInput
    update: XOR<SavedCarUpdateWithoutCarInput, SavedCarUncheckedUpdateWithoutCarInput>
    create: XOR<SavedCarCreateWithoutCarInput, SavedCarUncheckedCreateWithoutCarInput>
  }

  export type SavedCarUpdateWithWhereUniqueWithoutCarInput = {
    where: SavedCarWhereUniqueInput
    data: XOR<SavedCarUpdateWithoutCarInput, SavedCarUncheckedUpdateWithoutCarInput>
  }

  export type SavedCarUpdateManyWithWhereWithoutCarInput = {
    where: SavedCarScalarWhereInput
    data: XOR<SavedCarUpdateManyMutationInput, SavedCarUncheckedUpdateManyWithoutCarInput>
  }

  export type TestDriveUpsertWithWhereUniqueWithoutCarInput = {
    where: TestDriveWhereUniqueInput
    update: XOR<TestDriveUpdateWithoutCarInput, TestDriveUncheckedUpdateWithoutCarInput>
    create: XOR<TestDriveCreateWithoutCarInput, TestDriveUncheckedCreateWithoutCarInput>
  }

  export type TestDriveUpdateWithWhereUniqueWithoutCarInput = {
    where: TestDriveWhereUniqueInput
    data: XOR<TestDriveUpdateWithoutCarInput, TestDriveUncheckedUpdateWithoutCarInput>
  }

  export type TestDriveUpdateManyWithWhereWithoutCarInput = {
    where: TestDriveScalarWhereInput
    data: XOR<TestDriveUpdateManyMutationInput, TestDriveUncheckedUpdateManyWithoutCarInput>
  }

  export type WorkingHoursCreateWithoutDealershipInput = {
    id?: string
    dayOfWeek?: WorkingHoursCreatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime: string
    closeTime: string
    isOpen?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkingHoursUncheckedCreateWithoutDealershipInput = {
    id?: string
    dayOfWeek?: WorkingHoursCreatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime: string
    closeTime: string
    isOpen?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkingHoursCreateOrConnectWithoutDealershipInput = {
    where: WorkingHoursWhereUniqueInput
    create: XOR<WorkingHoursCreateWithoutDealershipInput, WorkingHoursUncheckedCreateWithoutDealershipInput>
  }

  export type WorkingHoursCreateManyDealershipInputEnvelope = {
    data: WorkingHoursCreateManyDealershipInput | WorkingHoursCreateManyDealershipInput[]
    skipDuplicates?: boolean
  }

  export type WorkingHoursUpsertWithWhereUniqueWithoutDealershipInput = {
    where: WorkingHoursWhereUniqueInput
    update: XOR<WorkingHoursUpdateWithoutDealershipInput, WorkingHoursUncheckedUpdateWithoutDealershipInput>
    create: XOR<WorkingHoursCreateWithoutDealershipInput, WorkingHoursUncheckedCreateWithoutDealershipInput>
  }

  export type WorkingHoursUpdateWithWhereUniqueWithoutDealershipInput = {
    where: WorkingHoursWhereUniqueInput
    data: XOR<WorkingHoursUpdateWithoutDealershipInput, WorkingHoursUncheckedUpdateWithoutDealershipInput>
  }

  export type WorkingHoursUpdateManyWithWhereWithoutDealershipInput = {
    where: WorkingHoursScalarWhereInput
    data: XOR<WorkingHoursUpdateManyMutationInput, WorkingHoursUncheckedUpdateManyWithoutDealershipInput>
  }

  export type WorkingHoursScalarWhereInput = {
    AND?: WorkingHoursScalarWhereInput | WorkingHoursScalarWhereInput[]
    OR?: WorkingHoursScalarWhereInput[]
    NOT?: WorkingHoursScalarWhereInput | WorkingHoursScalarWhereInput[]
    id?: StringFilter<"WorkingHours"> | string
    dayOfWeek?: EnumDayOfWeekNullableListFilter<"WorkingHours">
    openTime?: StringFilter<"WorkingHours"> | string
    closeTime?: StringFilter<"WorkingHours"> | string
    isOpen?: BoolFilter<"WorkingHours"> | boolean
    dealershipId?: StringFilter<"WorkingHours"> | string
    createdAt?: DateTimeFilter<"WorkingHours"> | Date | string
    updatedAt?: DateTimeFilter<"WorkingHours"> | Date | string
  }

  export type DealershipCreateWithoutWorkingHoursInput = {
    id?: string
    name?: string
    address?: string
    phone?: string
    email?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DealershipUncheckedCreateWithoutWorkingHoursInput = {
    id?: string
    name?: string
    address?: string
    phone?: string
    email?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DealershipCreateOrConnectWithoutWorkingHoursInput = {
    where: DealershipWhereUniqueInput
    create: XOR<DealershipCreateWithoutWorkingHoursInput, DealershipUncheckedCreateWithoutWorkingHoursInput>
  }

  export type DealershipUpsertWithoutWorkingHoursInput = {
    update: XOR<DealershipUpdateWithoutWorkingHoursInput, DealershipUncheckedUpdateWithoutWorkingHoursInput>
    create: XOR<DealershipCreateWithoutWorkingHoursInput, DealershipUncheckedCreateWithoutWorkingHoursInput>
    where?: DealershipWhereInput
  }

  export type DealershipUpdateToOneWithWhereWithoutWorkingHoursInput = {
    where?: DealershipWhereInput
    data: XOR<DealershipUpdateWithoutWorkingHoursInput, DealershipUncheckedUpdateWithoutWorkingHoursInput>
  }

  export type DealershipUpdateWithoutWorkingHoursInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DealershipUncheckedUpdateWithoutWorkingHoursInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CarCreateWithoutSavedByInput = {
    id?: string
    make: string
    model: string
    year: number
    price: Decimal | DecimalJsLike | number | string
    mileage: number
    fuelType: string
    transmission: string
    color: string
    seats?: number | null
    bodyType: string
    featured?: boolean
    status?: $Enums.CarStatus
    images?: CarCreateimagesInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    title?: string | null
    description?: string | null
    location?: string | null
    features?: CarCreatefeaturesInput | string[]
    testDrive?: TestDriveCreateNestedManyWithoutCarInput
  }

  export type CarUncheckedCreateWithoutSavedByInput = {
    id?: string
    make: string
    model: string
    year: number
    price: Decimal | DecimalJsLike | number | string
    mileage: number
    fuelType: string
    transmission: string
    color: string
    seats?: number | null
    bodyType: string
    featured?: boolean
    status?: $Enums.CarStatus
    images?: CarCreateimagesInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    title?: string | null
    description?: string | null
    location?: string | null
    features?: CarCreatefeaturesInput | string[]
    testDrive?: TestDriveUncheckedCreateNestedManyWithoutCarInput
  }

  export type CarCreateOrConnectWithoutSavedByInput = {
    where: CarWhereUniqueInput
    create: XOR<CarCreateWithoutSavedByInput, CarUncheckedCreateWithoutSavedByInput>
  }

  export type UserCreateWithoutSavedCarsInput = {
    id?: string
    clerkId: string
    email: string
    name?: string | null
    imageUrl?: string | null
    phone?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.UserRole
    testDrives?: TestDriveCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSavedCarsInput = {
    id?: string
    clerkId: string
    email: string
    name?: string | null
    imageUrl?: string | null
    phone?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.UserRole
    testDrives?: TestDriveUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSavedCarsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSavedCarsInput, UserUncheckedCreateWithoutSavedCarsInput>
  }

  export type CarUpsertWithoutSavedByInput = {
    update: XOR<CarUpdateWithoutSavedByInput, CarUncheckedUpdateWithoutSavedByInput>
    create: XOR<CarCreateWithoutSavedByInput, CarUncheckedCreateWithoutSavedByInput>
    where?: CarWhereInput
  }

  export type CarUpdateToOneWithWhereWithoutSavedByInput = {
    where?: CarWhereInput
    data: XOR<CarUpdateWithoutSavedByInput, CarUncheckedUpdateWithoutSavedByInput>
  }

  export type CarUpdateWithoutSavedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    make?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    mileage?: IntFieldUpdateOperationsInput | number
    fuelType?: StringFieldUpdateOperationsInput | string
    transmission?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    seats?: NullableIntFieldUpdateOperationsInput | number | null
    bodyType?: StringFieldUpdateOperationsInput | string
    featured?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumCarStatusFieldUpdateOperationsInput | $Enums.CarStatus
    images?: CarUpdateimagesInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    features?: CarUpdatefeaturesInput | string[]
    testDrive?: TestDriveUpdateManyWithoutCarNestedInput
  }

  export type CarUncheckedUpdateWithoutSavedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    make?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    mileage?: IntFieldUpdateOperationsInput | number
    fuelType?: StringFieldUpdateOperationsInput | string
    transmission?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    seats?: NullableIntFieldUpdateOperationsInput | number | null
    bodyType?: StringFieldUpdateOperationsInput | string
    featured?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumCarStatusFieldUpdateOperationsInput | $Enums.CarStatus
    images?: CarUpdateimagesInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    features?: CarUpdatefeaturesInput | string[]
    testDrive?: TestDriveUncheckedUpdateManyWithoutCarNestedInput
  }

  export type UserUpsertWithoutSavedCarsInput = {
    update: XOR<UserUpdateWithoutSavedCarsInput, UserUncheckedUpdateWithoutSavedCarsInput>
    create: XOR<UserCreateWithoutSavedCarsInput, UserUncheckedCreateWithoutSavedCarsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSavedCarsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSavedCarsInput, UserUncheckedUpdateWithoutSavedCarsInput>
  }

  export type UserUpdateWithoutSavedCarsInput = {
    id?: StringFieldUpdateOperationsInput | string
    clerkId?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    testDrives?: TestDriveUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSavedCarsInput = {
    id?: StringFieldUpdateOperationsInput | string
    clerkId?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    testDrives?: TestDriveUncheckedUpdateManyWithoutUserNestedInput
  }

  export type CarCreateWithoutTestDriveInput = {
    id?: string
    make: string
    model: string
    year: number
    price: Decimal | DecimalJsLike | number | string
    mileage: number
    fuelType: string
    transmission: string
    color: string
    seats?: number | null
    bodyType: string
    featured?: boolean
    status?: $Enums.CarStatus
    images?: CarCreateimagesInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    title?: string | null
    description?: string | null
    location?: string | null
    features?: CarCreatefeaturesInput | string[]
    savedBy?: SavedCarCreateNestedManyWithoutCarInput
  }

  export type CarUncheckedCreateWithoutTestDriveInput = {
    id?: string
    make: string
    model: string
    year: number
    price: Decimal | DecimalJsLike | number | string
    mileage: number
    fuelType: string
    transmission: string
    color: string
    seats?: number | null
    bodyType: string
    featured?: boolean
    status?: $Enums.CarStatus
    images?: CarCreateimagesInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    title?: string | null
    description?: string | null
    location?: string | null
    features?: CarCreatefeaturesInput | string[]
    savedBy?: SavedCarUncheckedCreateNestedManyWithoutCarInput
  }

  export type CarCreateOrConnectWithoutTestDriveInput = {
    where: CarWhereUniqueInput
    create: XOR<CarCreateWithoutTestDriveInput, CarUncheckedCreateWithoutTestDriveInput>
  }

  export type UserCreateWithoutTestDrivesInput = {
    id?: string
    clerkId: string
    email: string
    name?: string | null
    imageUrl?: string | null
    phone?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.UserRole
    savedCars?: SavedCarCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutTestDrivesInput = {
    id?: string
    clerkId: string
    email: string
    name?: string | null
    imageUrl?: string | null
    phone?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    role?: $Enums.UserRole
    savedCars?: SavedCarUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutTestDrivesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTestDrivesInput, UserUncheckedCreateWithoutTestDrivesInput>
  }

  export type CarUpsertWithoutTestDriveInput = {
    update: XOR<CarUpdateWithoutTestDriveInput, CarUncheckedUpdateWithoutTestDriveInput>
    create: XOR<CarCreateWithoutTestDriveInput, CarUncheckedCreateWithoutTestDriveInput>
    where?: CarWhereInput
  }

  export type CarUpdateToOneWithWhereWithoutTestDriveInput = {
    where?: CarWhereInput
    data: XOR<CarUpdateWithoutTestDriveInput, CarUncheckedUpdateWithoutTestDriveInput>
  }

  export type CarUpdateWithoutTestDriveInput = {
    id?: StringFieldUpdateOperationsInput | string
    make?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    mileage?: IntFieldUpdateOperationsInput | number
    fuelType?: StringFieldUpdateOperationsInput | string
    transmission?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    seats?: NullableIntFieldUpdateOperationsInput | number | null
    bodyType?: StringFieldUpdateOperationsInput | string
    featured?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumCarStatusFieldUpdateOperationsInput | $Enums.CarStatus
    images?: CarUpdateimagesInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    features?: CarUpdatefeaturesInput | string[]
    savedBy?: SavedCarUpdateManyWithoutCarNestedInput
  }

  export type CarUncheckedUpdateWithoutTestDriveInput = {
    id?: StringFieldUpdateOperationsInput | string
    make?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    mileage?: IntFieldUpdateOperationsInput | number
    fuelType?: StringFieldUpdateOperationsInput | string
    transmission?: StringFieldUpdateOperationsInput | string
    color?: StringFieldUpdateOperationsInput | string
    seats?: NullableIntFieldUpdateOperationsInput | number | null
    bodyType?: StringFieldUpdateOperationsInput | string
    featured?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumCarStatusFieldUpdateOperationsInput | $Enums.CarStatus
    images?: CarUpdateimagesInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    features?: CarUpdatefeaturesInput | string[]
    savedBy?: SavedCarUncheckedUpdateManyWithoutCarNestedInput
  }

  export type UserUpsertWithoutTestDrivesInput = {
    update: XOR<UserUpdateWithoutTestDrivesInput, UserUncheckedUpdateWithoutTestDrivesInput>
    create: XOR<UserCreateWithoutTestDrivesInput, UserUncheckedCreateWithoutTestDrivesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutTestDrivesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutTestDrivesInput, UserUncheckedUpdateWithoutTestDrivesInput>
  }

  export type UserUpdateWithoutTestDrivesInput = {
    id?: StringFieldUpdateOperationsInput | string
    clerkId?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    savedCars?: SavedCarUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutTestDrivesInput = {
    id?: StringFieldUpdateOperationsInput | string
    clerkId?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    savedCars?: SavedCarUncheckedUpdateManyWithoutUserNestedInput
  }

  export type SavedCarCreateManyUserInput = {
    id?: string
    carId: string
    createdAt?: Date | string
  }

  export type TestDriveCreateManyUserInput = {
    id?: string
    status?: $Enums.TestDriveStatus
    date: Date | string
    startTime: string
    endTime: string
    notes?: string | null
    carId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SavedCarUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    car?: CarUpdateOneRequiredWithoutSavedByNestedInput
  }

  export type SavedCarUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    carId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SavedCarUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    carId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestDriveUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumTestDriveStatusFieldUpdateOperationsInput | $Enums.TestDriveStatus
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    car?: CarUpdateOneRequiredWithoutTestDriveNestedInput
  }

  export type TestDriveUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumTestDriveStatusFieldUpdateOperationsInput | $Enums.TestDriveStatus
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    carId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestDriveUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumTestDriveStatusFieldUpdateOperationsInput | $Enums.TestDriveStatus
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    carId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SavedCarCreateManyCarInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type TestDriveCreateManyCarInput = {
    id?: string
    status?: $Enums.TestDriveStatus
    date: Date | string
    startTime: string
    endTime: string
    notes?: string | null
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SavedCarUpdateWithoutCarInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSavedCarsNestedInput
  }

  export type SavedCarUncheckedUpdateWithoutCarInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SavedCarUncheckedUpdateManyWithoutCarInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestDriveUpdateWithoutCarInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumTestDriveStatusFieldUpdateOperationsInput | $Enums.TestDriveStatus
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutTestDrivesNestedInput
  }

  export type TestDriveUncheckedUpdateWithoutCarInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumTestDriveStatusFieldUpdateOperationsInput | $Enums.TestDriveStatus
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestDriveUncheckedUpdateManyWithoutCarInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumTestDriveStatusFieldUpdateOperationsInput | $Enums.TestDriveStatus
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkingHoursCreateManyDealershipInput = {
    id?: string
    dayOfWeek?: WorkingHoursCreatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime: string
    closeTime: string
    isOpen?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkingHoursUpdateWithoutDealershipInput = {
    id?: StringFieldUpdateOperationsInput | string
    dayOfWeek?: WorkingHoursUpdatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime?: StringFieldUpdateOperationsInput | string
    closeTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkingHoursUncheckedUpdateWithoutDealershipInput = {
    id?: StringFieldUpdateOperationsInput | string
    dayOfWeek?: WorkingHoursUpdatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime?: StringFieldUpdateOperationsInput | string
    closeTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkingHoursUncheckedUpdateManyWithoutDealershipInput = {
    id?: StringFieldUpdateOperationsInput | string
    dayOfWeek?: WorkingHoursUpdatedayOfWeekInput | $Enums.DayOfWeek[]
    openTime?: StringFieldUpdateOperationsInput | string
    closeTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}