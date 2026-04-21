
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
 * Model KinoQuizMovie
 * 
 */
export type KinoQuizMovie = $Result.DefaultSelection<Prisma.$KinoQuizMoviePayload>
/**
 * Model KinoQuizSession
 * 
 */
export type KinoQuizSession = $Result.DefaultSelection<Prisma.$KinoQuizSessionPayload>
/**
 * Model KinoQuizScore
 * 
 */
export type KinoQuizScore = $Result.DefaultSelection<Prisma.$KinoQuizScorePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more KinoQuizMovies
 * const kinoQuizMovies = await prisma.kinoQuizMovie.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
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
   * // Fetch zero or more KinoQuizMovies
   * const kinoQuizMovies = await prisma.kinoQuizMovie.findMany()
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
   * `prisma.kinoQuizMovie`: Exposes CRUD operations for the **KinoQuizMovie** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more KinoQuizMovies
    * const kinoQuizMovies = await prisma.kinoQuizMovie.findMany()
    * ```
    */
  get kinoQuizMovie(): Prisma.KinoQuizMovieDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.kinoQuizSession`: Exposes CRUD operations for the **KinoQuizSession** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more KinoQuizSessions
    * const kinoQuizSessions = await prisma.kinoQuizSession.findMany()
    * ```
    */
  get kinoQuizSession(): Prisma.KinoQuizSessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.kinoQuizScore`: Exposes CRUD operations for the **KinoQuizScore** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more KinoQuizScores
    * const kinoQuizScores = await prisma.kinoQuizScore.findMany()
    * ```
    */
  get kinoQuizScore(): Prisma.KinoQuizScoreDelegate<ExtArgs, ClientOptions>;
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
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
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
    KinoQuizMovie: 'KinoQuizMovie',
    KinoQuizSession: 'KinoQuizSession',
    KinoQuizScore: 'KinoQuizScore'
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
      modelProps: "kinoQuizMovie" | "kinoQuizSession" | "kinoQuizScore"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      KinoQuizMovie: {
        payload: Prisma.$KinoQuizMoviePayload<ExtArgs>
        fields: Prisma.KinoQuizMovieFieldRefs
        operations: {
          findUnique: {
            args: Prisma.KinoQuizMovieFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizMoviePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.KinoQuizMovieFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizMoviePayload>
          }
          findFirst: {
            args: Prisma.KinoQuizMovieFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizMoviePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.KinoQuizMovieFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizMoviePayload>
          }
          findMany: {
            args: Prisma.KinoQuizMovieFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizMoviePayload>[]
          }
          create: {
            args: Prisma.KinoQuizMovieCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizMoviePayload>
          }
          createMany: {
            args: Prisma.KinoQuizMovieCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.KinoQuizMovieCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizMoviePayload>[]
          }
          delete: {
            args: Prisma.KinoQuizMovieDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizMoviePayload>
          }
          update: {
            args: Prisma.KinoQuizMovieUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizMoviePayload>
          }
          deleteMany: {
            args: Prisma.KinoQuizMovieDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.KinoQuizMovieUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.KinoQuizMovieUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizMoviePayload>[]
          }
          upsert: {
            args: Prisma.KinoQuizMovieUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizMoviePayload>
          }
          aggregate: {
            args: Prisma.KinoQuizMovieAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateKinoQuizMovie>
          }
          groupBy: {
            args: Prisma.KinoQuizMovieGroupByArgs<ExtArgs>
            result: $Utils.Optional<KinoQuizMovieGroupByOutputType>[]
          }
          count: {
            args: Prisma.KinoQuizMovieCountArgs<ExtArgs>
            result: $Utils.Optional<KinoQuizMovieCountAggregateOutputType> | number
          }
        }
      }
      KinoQuizSession: {
        payload: Prisma.$KinoQuizSessionPayload<ExtArgs>
        fields: Prisma.KinoQuizSessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.KinoQuizSessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizSessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.KinoQuizSessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizSessionPayload>
          }
          findFirst: {
            args: Prisma.KinoQuizSessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizSessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.KinoQuizSessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizSessionPayload>
          }
          findMany: {
            args: Prisma.KinoQuizSessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizSessionPayload>[]
          }
          create: {
            args: Prisma.KinoQuizSessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizSessionPayload>
          }
          createMany: {
            args: Prisma.KinoQuizSessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.KinoQuizSessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizSessionPayload>[]
          }
          delete: {
            args: Prisma.KinoQuizSessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizSessionPayload>
          }
          update: {
            args: Prisma.KinoQuizSessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizSessionPayload>
          }
          deleteMany: {
            args: Prisma.KinoQuizSessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.KinoQuizSessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.KinoQuizSessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizSessionPayload>[]
          }
          upsert: {
            args: Prisma.KinoQuizSessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizSessionPayload>
          }
          aggregate: {
            args: Prisma.KinoQuizSessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateKinoQuizSession>
          }
          groupBy: {
            args: Prisma.KinoQuizSessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<KinoQuizSessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.KinoQuizSessionCountArgs<ExtArgs>
            result: $Utils.Optional<KinoQuizSessionCountAggregateOutputType> | number
          }
        }
      }
      KinoQuizScore: {
        payload: Prisma.$KinoQuizScorePayload<ExtArgs>
        fields: Prisma.KinoQuizScoreFieldRefs
        operations: {
          findUnique: {
            args: Prisma.KinoQuizScoreFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizScorePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.KinoQuizScoreFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizScorePayload>
          }
          findFirst: {
            args: Prisma.KinoQuizScoreFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizScorePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.KinoQuizScoreFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizScorePayload>
          }
          findMany: {
            args: Prisma.KinoQuizScoreFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizScorePayload>[]
          }
          create: {
            args: Prisma.KinoQuizScoreCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizScorePayload>
          }
          createMany: {
            args: Prisma.KinoQuizScoreCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.KinoQuizScoreCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizScorePayload>[]
          }
          delete: {
            args: Prisma.KinoQuizScoreDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizScorePayload>
          }
          update: {
            args: Prisma.KinoQuizScoreUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizScorePayload>
          }
          deleteMany: {
            args: Prisma.KinoQuizScoreDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.KinoQuizScoreUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.KinoQuizScoreUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizScorePayload>[]
          }
          upsert: {
            args: Prisma.KinoQuizScoreUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KinoQuizScorePayload>
          }
          aggregate: {
            args: Prisma.KinoQuizScoreAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateKinoQuizScore>
          }
          groupBy: {
            args: Prisma.KinoQuizScoreGroupByArgs<ExtArgs>
            result: $Utils.Optional<KinoQuizScoreGroupByOutputType>[]
          }
          count: {
            args: Prisma.KinoQuizScoreCountArgs<ExtArgs>
            result: $Utils.Optional<KinoQuizScoreCountAggregateOutputType> | number
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
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
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
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
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
    kinoQuizMovie?: KinoQuizMovieOmit
    kinoQuizSession?: KinoQuizSessionOmit
    kinoQuizScore?: KinoQuizScoreOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

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
   * Models
   */

  /**
   * Model KinoQuizMovie
   */

  export type AggregateKinoQuizMovie = {
    _count: KinoQuizMovieCountAggregateOutputType | null
    _avg: KinoQuizMovieAvgAggregateOutputType | null
    _sum: KinoQuizMovieSumAggregateOutputType | null
    _min: KinoQuizMovieMinAggregateOutputType | null
    _max: KinoQuizMovieMaxAggregateOutputType | null
  }

  export type KinoQuizMovieAvgAggregateOutputType = {
    year: number | null
  }

  export type KinoQuizMovieSumAggregateOutputType = {
    year: number | null
  }

  export type KinoQuizMovieMinAggregateOutputType = {
    id: string | null
    title: string | null
    title_ru: string | null
    imageUrl: string | null
    type: string | null
    difficulty: string | null
    year: number | null
    createdAt: Date | null
  }

  export type KinoQuizMovieMaxAggregateOutputType = {
    id: string | null
    title: string | null
    title_ru: string | null
    imageUrl: string | null
    type: string | null
    difficulty: string | null
    year: number | null
    createdAt: Date | null
  }

  export type KinoQuizMovieCountAggregateOutputType = {
    id: number
    title: number
    title_ru: number
    imageUrl: number
    type: number
    difficulty: number
    year: number
    createdAt: number
    _all: number
  }


  export type KinoQuizMovieAvgAggregateInputType = {
    year?: true
  }

  export type KinoQuizMovieSumAggregateInputType = {
    year?: true
  }

  export type KinoQuizMovieMinAggregateInputType = {
    id?: true
    title?: true
    title_ru?: true
    imageUrl?: true
    type?: true
    difficulty?: true
    year?: true
    createdAt?: true
  }

  export type KinoQuizMovieMaxAggregateInputType = {
    id?: true
    title?: true
    title_ru?: true
    imageUrl?: true
    type?: true
    difficulty?: true
    year?: true
    createdAt?: true
  }

  export type KinoQuizMovieCountAggregateInputType = {
    id?: true
    title?: true
    title_ru?: true
    imageUrl?: true
    type?: true
    difficulty?: true
    year?: true
    createdAt?: true
    _all?: true
  }

  export type KinoQuizMovieAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KinoQuizMovie to aggregate.
     */
    where?: KinoQuizMovieWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizMovies to fetch.
     */
    orderBy?: KinoQuizMovieOrderByWithRelationInput | KinoQuizMovieOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: KinoQuizMovieWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizMovies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizMovies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned KinoQuizMovies
    **/
    _count?: true | KinoQuizMovieCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: KinoQuizMovieAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: KinoQuizMovieSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: KinoQuizMovieMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: KinoQuizMovieMaxAggregateInputType
  }

  export type GetKinoQuizMovieAggregateType<T extends KinoQuizMovieAggregateArgs> = {
        [P in keyof T & keyof AggregateKinoQuizMovie]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateKinoQuizMovie[P]>
      : GetScalarType<T[P], AggregateKinoQuizMovie[P]>
  }




  export type KinoQuizMovieGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: KinoQuizMovieWhereInput
    orderBy?: KinoQuizMovieOrderByWithAggregationInput | KinoQuizMovieOrderByWithAggregationInput[]
    by: KinoQuizMovieScalarFieldEnum[] | KinoQuizMovieScalarFieldEnum
    having?: KinoQuizMovieScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: KinoQuizMovieCountAggregateInputType | true
    _avg?: KinoQuizMovieAvgAggregateInputType
    _sum?: KinoQuizMovieSumAggregateInputType
    _min?: KinoQuizMovieMinAggregateInputType
    _max?: KinoQuizMovieMaxAggregateInputType
  }

  export type KinoQuizMovieGroupByOutputType = {
    id: string
    title: string
    title_ru: string
    imageUrl: string
    type: string
    difficulty: string
    year: number | null
    createdAt: Date
    _count: KinoQuizMovieCountAggregateOutputType | null
    _avg: KinoQuizMovieAvgAggregateOutputType | null
    _sum: KinoQuizMovieSumAggregateOutputType | null
    _min: KinoQuizMovieMinAggregateOutputType | null
    _max: KinoQuizMovieMaxAggregateOutputType | null
  }

  type GetKinoQuizMovieGroupByPayload<T extends KinoQuizMovieGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<KinoQuizMovieGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof KinoQuizMovieGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], KinoQuizMovieGroupByOutputType[P]>
            : GetScalarType<T[P], KinoQuizMovieGroupByOutputType[P]>
        }
      >
    >


  export type KinoQuizMovieSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    title_ru?: boolean
    imageUrl?: boolean
    type?: boolean
    difficulty?: boolean
    year?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["kinoQuizMovie"]>

  export type KinoQuizMovieSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    title_ru?: boolean
    imageUrl?: boolean
    type?: boolean
    difficulty?: boolean
    year?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["kinoQuizMovie"]>

  export type KinoQuizMovieSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    title_ru?: boolean
    imageUrl?: boolean
    type?: boolean
    difficulty?: boolean
    year?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["kinoQuizMovie"]>

  export type KinoQuizMovieSelectScalar = {
    id?: boolean
    title?: boolean
    title_ru?: boolean
    imageUrl?: boolean
    type?: boolean
    difficulty?: boolean
    year?: boolean
    createdAt?: boolean
  }

  export type KinoQuizMovieOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "title_ru" | "imageUrl" | "type" | "difficulty" | "year" | "createdAt", ExtArgs["result"]["kinoQuizMovie"]>

  export type $KinoQuizMoviePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "KinoQuizMovie"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      title_ru: string
      imageUrl: string
      type: string
      difficulty: string
      year: number | null
      createdAt: Date
    }, ExtArgs["result"]["kinoQuizMovie"]>
    composites: {}
  }

  type KinoQuizMovieGetPayload<S extends boolean | null | undefined | KinoQuizMovieDefaultArgs> = $Result.GetResult<Prisma.$KinoQuizMoviePayload, S>

  type KinoQuizMovieCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<KinoQuizMovieFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: KinoQuizMovieCountAggregateInputType | true
    }

  export interface KinoQuizMovieDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['KinoQuizMovie'], meta: { name: 'KinoQuizMovie' } }
    /**
     * Find zero or one KinoQuizMovie that matches the filter.
     * @param {KinoQuizMovieFindUniqueArgs} args - Arguments to find a KinoQuizMovie
     * @example
     * // Get one KinoQuizMovie
     * const kinoQuizMovie = await prisma.kinoQuizMovie.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends KinoQuizMovieFindUniqueArgs>(args: SelectSubset<T, KinoQuizMovieFindUniqueArgs<ExtArgs>>): Prisma__KinoQuizMovieClient<$Result.GetResult<Prisma.$KinoQuizMoviePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one KinoQuizMovie that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {KinoQuizMovieFindUniqueOrThrowArgs} args - Arguments to find a KinoQuizMovie
     * @example
     * // Get one KinoQuizMovie
     * const kinoQuizMovie = await prisma.kinoQuizMovie.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends KinoQuizMovieFindUniqueOrThrowArgs>(args: SelectSubset<T, KinoQuizMovieFindUniqueOrThrowArgs<ExtArgs>>): Prisma__KinoQuizMovieClient<$Result.GetResult<Prisma.$KinoQuizMoviePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KinoQuizMovie that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizMovieFindFirstArgs} args - Arguments to find a KinoQuizMovie
     * @example
     * // Get one KinoQuizMovie
     * const kinoQuizMovie = await prisma.kinoQuizMovie.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends KinoQuizMovieFindFirstArgs>(args?: SelectSubset<T, KinoQuizMovieFindFirstArgs<ExtArgs>>): Prisma__KinoQuizMovieClient<$Result.GetResult<Prisma.$KinoQuizMoviePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KinoQuizMovie that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizMovieFindFirstOrThrowArgs} args - Arguments to find a KinoQuizMovie
     * @example
     * // Get one KinoQuizMovie
     * const kinoQuizMovie = await prisma.kinoQuizMovie.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends KinoQuizMovieFindFirstOrThrowArgs>(args?: SelectSubset<T, KinoQuizMovieFindFirstOrThrowArgs<ExtArgs>>): Prisma__KinoQuizMovieClient<$Result.GetResult<Prisma.$KinoQuizMoviePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more KinoQuizMovies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizMovieFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all KinoQuizMovies
     * const kinoQuizMovies = await prisma.kinoQuizMovie.findMany()
     * 
     * // Get first 10 KinoQuizMovies
     * const kinoQuizMovies = await prisma.kinoQuizMovie.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const kinoQuizMovieWithIdOnly = await prisma.kinoQuizMovie.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends KinoQuizMovieFindManyArgs>(args?: SelectSubset<T, KinoQuizMovieFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KinoQuizMoviePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a KinoQuizMovie.
     * @param {KinoQuizMovieCreateArgs} args - Arguments to create a KinoQuizMovie.
     * @example
     * // Create one KinoQuizMovie
     * const KinoQuizMovie = await prisma.kinoQuizMovie.create({
     *   data: {
     *     // ... data to create a KinoQuizMovie
     *   }
     * })
     * 
     */
    create<T extends KinoQuizMovieCreateArgs>(args: SelectSubset<T, KinoQuizMovieCreateArgs<ExtArgs>>): Prisma__KinoQuizMovieClient<$Result.GetResult<Prisma.$KinoQuizMoviePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many KinoQuizMovies.
     * @param {KinoQuizMovieCreateManyArgs} args - Arguments to create many KinoQuizMovies.
     * @example
     * // Create many KinoQuizMovies
     * const kinoQuizMovie = await prisma.kinoQuizMovie.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends KinoQuizMovieCreateManyArgs>(args?: SelectSubset<T, KinoQuizMovieCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many KinoQuizMovies and returns the data saved in the database.
     * @param {KinoQuizMovieCreateManyAndReturnArgs} args - Arguments to create many KinoQuizMovies.
     * @example
     * // Create many KinoQuizMovies
     * const kinoQuizMovie = await prisma.kinoQuizMovie.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many KinoQuizMovies and only return the `id`
     * const kinoQuizMovieWithIdOnly = await prisma.kinoQuizMovie.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends KinoQuizMovieCreateManyAndReturnArgs>(args?: SelectSubset<T, KinoQuizMovieCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KinoQuizMoviePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a KinoQuizMovie.
     * @param {KinoQuizMovieDeleteArgs} args - Arguments to delete one KinoQuizMovie.
     * @example
     * // Delete one KinoQuizMovie
     * const KinoQuizMovie = await prisma.kinoQuizMovie.delete({
     *   where: {
     *     // ... filter to delete one KinoQuizMovie
     *   }
     * })
     * 
     */
    delete<T extends KinoQuizMovieDeleteArgs>(args: SelectSubset<T, KinoQuizMovieDeleteArgs<ExtArgs>>): Prisma__KinoQuizMovieClient<$Result.GetResult<Prisma.$KinoQuizMoviePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one KinoQuizMovie.
     * @param {KinoQuizMovieUpdateArgs} args - Arguments to update one KinoQuizMovie.
     * @example
     * // Update one KinoQuizMovie
     * const kinoQuizMovie = await prisma.kinoQuizMovie.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends KinoQuizMovieUpdateArgs>(args: SelectSubset<T, KinoQuizMovieUpdateArgs<ExtArgs>>): Prisma__KinoQuizMovieClient<$Result.GetResult<Prisma.$KinoQuizMoviePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more KinoQuizMovies.
     * @param {KinoQuizMovieDeleteManyArgs} args - Arguments to filter KinoQuizMovies to delete.
     * @example
     * // Delete a few KinoQuizMovies
     * const { count } = await prisma.kinoQuizMovie.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends KinoQuizMovieDeleteManyArgs>(args?: SelectSubset<T, KinoQuizMovieDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KinoQuizMovies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizMovieUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many KinoQuizMovies
     * const kinoQuizMovie = await prisma.kinoQuizMovie.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends KinoQuizMovieUpdateManyArgs>(args: SelectSubset<T, KinoQuizMovieUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KinoQuizMovies and returns the data updated in the database.
     * @param {KinoQuizMovieUpdateManyAndReturnArgs} args - Arguments to update many KinoQuizMovies.
     * @example
     * // Update many KinoQuizMovies
     * const kinoQuizMovie = await prisma.kinoQuizMovie.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more KinoQuizMovies and only return the `id`
     * const kinoQuizMovieWithIdOnly = await prisma.kinoQuizMovie.updateManyAndReturn({
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
    updateManyAndReturn<T extends KinoQuizMovieUpdateManyAndReturnArgs>(args: SelectSubset<T, KinoQuizMovieUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KinoQuizMoviePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one KinoQuizMovie.
     * @param {KinoQuizMovieUpsertArgs} args - Arguments to update or create a KinoQuizMovie.
     * @example
     * // Update or create a KinoQuizMovie
     * const kinoQuizMovie = await prisma.kinoQuizMovie.upsert({
     *   create: {
     *     // ... data to create a KinoQuizMovie
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the KinoQuizMovie we want to update
     *   }
     * })
     */
    upsert<T extends KinoQuizMovieUpsertArgs>(args: SelectSubset<T, KinoQuizMovieUpsertArgs<ExtArgs>>): Prisma__KinoQuizMovieClient<$Result.GetResult<Prisma.$KinoQuizMoviePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of KinoQuizMovies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizMovieCountArgs} args - Arguments to filter KinoQuizMovies to count.
     * @example
     * // Count the number of KinoQuizMovies
     * const count = await prisma.kinoQuizMovie.count({
     *   where: {
     *     // ... the filter for the KinoQuizMovies we want to count
     *   }
     * })
    **/
    count<T extends KinoQuizMovieCountArgs>(
      args?: Subset<T, KinoQuizMovieCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], KinoQuizMovieCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a KinoQuizMovie.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizMovieAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends KinoQuizMovieAggregateArgs>(args: Subset<T, KinoQuizMovieAggregateArgs>): Prisma.PrismaPromise<GetKinoQuizMovieAggregateType<T>>

    /**
     * Group by KinoQuizMovie.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizMovieGroupByArgs} args - Group by arguments.
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
      T extends KinoQuizMovieGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: KinoQuizMovieGroupByArgs['orderBy'] }
        : { orderBy?: KinoQuizMovieGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, KinoQuizMovieGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetKinoQuizMovieGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the KinoQuizMovie model
   */
  readonly fields: KinoQuizMovieFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for KinoQuizMovie.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__KinoQuizMovieClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the KinoQuizMovie model
   */
  interface KinoQuizMovieFieldRefs {
    readonly id: FieldRef<"KinoQuizMovie", 'String'>
    readonly title: FieldRef<"KinoQuizMovie", 'String'>
    readonly title_ru: FieldRef<"KinoQuizMovie", 'String'>
    readonly imageUrl: FieldRef<"KinoQuizMovie", 'String'>
    readonly type: FieldRef<"KinoQuizMovie", 'String'>
    readonly difficulty: FieldRef<"KinoQuizMovie", 'String'>
    readonly year: FieldRef<"KinoQuizMovie", 'Int'>
    readonly createdAt: FieldRef<"KinoQuizMovie", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * KinoQuizMovie findUnique
   */
  export type KinoQuizMovieFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizMovie to fetch.
     */
    where: KinoQuizMovieWhereUniqueInput
  }

  /**
   * KinoQuizMovie findUniqueOrThrow
   */
  export type KinoQuizMovieFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizMovie to fetch.
     */
    where: KinoQuizMovieWhereUniqueInput
  }

  /**
   * KinoQuizMovie findFirst
   */
  export type KinoQuizMovieFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizMovie to fetch.
     */
    where?: KinoQuizMovieWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizMovies to fetch.
     */
    orderBy?: KinoQuizMovieOrderByWithRelationInput | KinoQuizMovieOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KinoQuizMovies.
     */
    cursor?: KinoQuizMovieWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizMovies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizMovies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KinoQuizMovies.
     */
    distinct?: KinoQuizMovieScalarFieldEnum | KinoQuizMovieScalarFieldEnum[]
  }

  /**
   * KinoQuizMovie findFirstOrThrow
   */
  export type KinoQuizMovieFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizMovie to fetch.
     */
    where?: KinoQuizMovieWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizMovies to fetch.
     */
    orderBy?: KinoQuizMovieOrderByWithRelationInput | KinoQuizMovieOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KinoQuizMovies.
     */
    cursor?: KinoQuizMovieWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizMovies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizMovies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KinoQuizMovies.
     */
    distinct?: KinoQuizMovieScalarFieldEnum | KinoQuizMovieScalarFieldEnum[]
  }

  /**
   * KinoQuizMovie findMany
   */
  export type KinoQuizMovieFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizMovies to fetch.
     */
    where?: KinoQuizMovieWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizMovies to fetch.
     */
    orderBy?: KinoQuizMovieOrderByWithRelationInput | KinoQuizMovieOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing KinoQuizMovies.
     */
    cursor?: KinoQuizMovieWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizMovies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizMovies.
     */
    skip?: number
    distinct?: KinoQuizMovieScalarFieldEnum | KinoQuizMovieScalarFieldEnum[]
  }

  /**
   * KinoQuizMovie create
   */
  export type KinoQuizMovieCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
    /**
     * The data needed to create a KinoQuizMovie.
     */
    data: XOR<KinoQuizMovieCreateInput, KinoQuizMovieUncheckedCreateInput>
  }

  /**
   * KinoQuizMovie createMany
   */
  export type KinoQuizMovieCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many KinoQuizMovies.
     */
    data: KinoQuizMovieCreateManyInput | KinoQuizMovieCreateManyInput[]
  }

  /**
   * KinoQuizMovie createManyAndReturn
   */
  export type KinoQuizMovieCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
    /**
     * The data used to create many KinoQuizMovies.
     */
    data: KinoQuizMovieCreateManyInput | KinoQuizMovieCreateManyInput[]
  }

  /**
   * KinoQuizMovie update
   */
  export type KinoQuizMovieUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
    /**
     * The data needed to update a KinoQuizMovie.
     */
    data: XOR<KinoQuizMovieUpdateInput, KinoQuizMovieUncheckedUpdateInput>
    /**
     * Choose, which KinoQuizMovie to update.
     */
    where: KinoQuizMovieWhereUniqueInput
  }

  /**
   * KinoQuizMovie updateMany
   */
  export type KinoQuizMovieUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update KinoQuizMovies.
     */
    data: XOR<KinoQuizMovieUpdateManyMutationInput, KinoQuizMovieUncheckedUpdateManyInput>
    /**
     * Filter which KinoQuizMovies to update
     */
    where?: KinoQuizMovieWhereInput
    /**
     * Limit how many KinoQuizMovies to update.
     */
    limit?: number
  }

  /**
   * KinoQuizMovie updateManyAndReturn
   */
  export type KinoQuizMovieUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
    /**
     * The data used to update KinoQuizMovies.
     */
    data: XOR<KinoQuizMovieUpdateManyMutationInput, KinoQuizMovieUncheckedUpdateManyInput>
    /**
     * Filter which KinoQuizMovies to update
     */
    where?: KinoQuizMovieWhereInput
    /**
     * Limit how many KinoQuizMovies to update.
     */
    limit?: number
  }

  /**
   * KinoQuizMovie upsert
   */
  export type KinoQuizMovieUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
    /**
     * The filter to search for the KinoQuizMovie to update in case it exists.
     */
    where: KinoQuizMovieWhereUniqueInput
    /**
     * In case the KinoQuizMovie found by the `where` argument doesn't exist, create a new KinoQuizMovie with this data.
     */
    create: XOR<KinoQuizMovieCreateInput, KinoQuizMovieUncheckedCreateInput>
    /**
     * In case the KinoQuizMovie was found with the provided `where` argument, update it with this data.
     */
    update: XOR<KinoQuizMovieUpdateInput, KinoQuizMovieUncheckedUpdateInput>
  }

  /**
   * KinoQuizMovie delete
   */
  export type KinoQuizMovieDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
    /**
     * Filter which KinoQuizMovie to delete.
     */
    where: KinoQuizMovieWhereUniqueInput
  }

  /**
   * KinoQuizMovie deleteMany
   */
  export type KinoQuizMovieDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KinoQuizMovies to delete
     */
    where?: KinoQuizMovieWhereInput
    /**
     * Limit how many KinoQuizMovies to delete.
     */
    limit?: number
  }

  /**
   * KinoQuizMovie without action
   */
  export type KinoQuizMovieDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizMovie
     */
    select?: KinoQuizMovieSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizMovie
     */
    omit?: KinoQuizMovieOmit<ExtArgs> | null
  }


  /**
   * Model KinoQuizSession
   */

  export type AggregateKinoQuizSession = {
    _count: KinoQuizSessionCountAggregateOutputType | null
    _avg: KinoQuizSessionAvgAggregateOutputType | null
    _sum: KinoQuizSessionSumAggregateOutputType | null
    _min: KinoQuizSessionMinAggregateOutputType | null
    _max: KinoQuizSessionMaxAggregateOutputType | null
  }

  export type KinoQuizSessionAvgAggregateOutputType = {
    currentRound: number | null
  }

  export type KinoQuizSessionSumAggregateOutputType = {
    currentRound: number | null
  }

  export type KinoQuizSessionMinAggregateOutputType = {
    id: string | null
    hostUsername: string | null
    status: string | null
    type: string | null
    currentRound: number | null
    createdAt: Date | null
  }

  export type KinoQuizSessionMaxAggregateOutputType = {
    id: string | null
    hostUsername: string | null
    status: string | null
    type: string | null
    currentRound: number | null
    createdAt: Date | null
  }

  export type KinoQuizSessionCountAggregateOutputType = {
    id: number
    hostUsername: number
    status: number
    type: number
    currentRound: number
    createdAt: number
    _all: number
  }


  export type KinoQuizSessionAvgAggregateInputType = {
    currentRound?: true
  }

  export type KinoQuizSessionSumAggregateInputType = {
    currentRound?: true
  }

  export type KinoQuizSessionMinAggregateInputType = {
    id?: true
    hostUsername?: true
    status?: true
    type?: true
    currentRound?: true
    createdAt?: true
  }

  export type KinoQuizSessionMaxAggregateInputType = {
    id?: true
    hostUsername?: true
    status?: true
    type?: true
    currentRound?: true
    createdAt?: true
  }

  export type KinoQuizSessionCountAggregateInputType = {
    id?: true
    hostUsername?: true
    status?: true
    type?: true
    currentRound?: true
    createdAt?: true
    _all?: true
  }

  export type KinoQuizSessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KinoQuizSession to aggregate.
     */
    where?: KinoQuizSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizSessions to fetch.
     */
    orderBy?: KinoQuizSessionOrderByWithRelationInput | KinoQuizSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: KinoQuizSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned KinoQuizSessions
    **/
    _count?: true | KinoQuizSessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: KinoQuizSessionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: KinoQuizSessionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: KinoQuizSessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: KinoQuizSessionMaxAggregateInputType
  }

  export type GetKinoQuizSessionAggregateType<T extends KinoQuizSessionAggregateArgs> = {
        [P in keyof T & keyof AggregateKinoQuizSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateKinoQuizSession[P]>
      : GetScalarType<T[P], AggregateKinoQuizSession[P]>
  }




  export type KinoQuizSessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: KinoQuizSessionWhereInput
    orderBy?: KinoQuizSessionOrderByWithAggregationInput | KinoQuizSessionOrderByWithAggregationInput[]
    by: KinoQuizSessionScalarFieldEnum[] | KinoQuizSessionScalarFieldEnum
    having?: KinoQuizSessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: KinoQuizSessionCountAggregateInputType | true
    _avg?: KinoQuizSessionAvgAggregateInputType
    _sum?: KinoQuizSessionSumAggregateInputType
    _min?: KinoQuizSessionMinAggregateInputType
    _max?: KinoQuizSessionMaxAggregateInputType
  }

  export type KinoQuizSessionGroupByOutputType = {
    id: string
    hostUsername: string
    status: string
    type: string
    currentRound: number
    createdAt: Date
    _count: KinoQuizSessionCountAggregateOutputType | null
    _avg: KinoQuizSessionAvgAggregateOutputType | null
    _sum: KinoQuizSessionSumAggregateOutputType | null
    _min: KinoQuizSessionMinAggregateOutputType | null
    _max: KinoQuizSessionMaxAggregateOutputType | null
  }

  type GetKinoQuizSessionGroupByPayload<T extends KinoQuizSessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<KinoQuizSessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof KinoQuizSessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], KinoQuizSessionGroupByOutputType[P]>
            : GetScalarType<T[P], KinoQuizSessionGroupByOutputType[P]>
        }
      >
    >


  export type KinoQuizSessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hostUsername?: boolean
    status?: boolean
    type?: boolean
    currentRound?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["kinoQuizSession"]>

  export type KinoQuizSessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hostUsername?: boolean
    status?: boolean
    type?: boolean
    currentRound?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["kinoQuizSession"]>

  export type KinoQuizSessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hostUsername?: boolean
    status?: boolean
    type?: boolean
    currentRound?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["kinoQuizSession"]>

  export type KinoQuizSessionSelectScalar = {
    id?: boolean
    hostUsername?: boolean
    status?: boolean
    type?: boolean
    currentRound?: boolean
    createdAt?: boolean
  }

  export type KinoQuizSessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "hostUsername" | "status" | "type" | "currentRound" | "createdAt", ExtArgs["result"]["kinoQuizSession"]>

  export type $KinoQuizSessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "KinoQuizSession"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      hostUsername: string
      status: string
      type: string
      currentRound: number
      createdAt: Date
    }, ExtArgs["result"]["kinoQuizSession"]>
    composites: {}
  }

  type KinoQuizSessionGetPayload<S extends boolean | null | undefined | KinoQuizSessionDefaultArgs> = $Result.GetResult<Prisma.$KinoQuizSessionPayload, S>

  type KinoQuizSessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<KinoQuizSessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: KinoQuizSessionCountAggregateInputType | true
    }

  export interface KinoQuizSessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['KinoQuizSession'], meta: { name: 'KinoQuizSession' } }
    /**
     * Find zero or one KinoQuizSession that matches the filter.
     * @param {KinoQuizSessionFindUniqueArgs} args - Arguments to find a KinoQuizSession
     * @example
     * // Get one KinoQuizSession
     * const kinoQuizSession = await prisma.kinoQuizSession.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends KinoQuizSessionFindUniqueArgs>(args: SelectSubset<T, KinoQuizSessionFindUniqueArgs<ExtArgs>>): Prisma__KinoQuizSessionClient<$Result.GetResult<Prisma.$KinoQuizSessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one KinoQuizSession that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {KinoQuizSessionFindUniqueOrThrowArgs} args - Arguments to find a KinoQuizSession
     * @example
     * // Get one KinoQuizSession
     * const kinoQuizSession = await prisma.kinoQuizSession.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends KinoQuizSessionFindUniqueOrThrowArgs>(args: SelectSubset<T, KinoQuizSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__KinoQuizSessionClient<$Result.GetResult<Prisma.$KinoQuizSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KinoQuizSession that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizSessionFindFirstArgs} args - Arguments to find a KinoQuizSession
     * @example
     * // Get one KinoQuizSession
     * const kinoQuizSession = await prisma.kinoQuizSession.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends KinoQuizSessionFindFirstArgs>(args?: SelectSubset<T, KinoQuizSessionFindFirstArgs<ExtArgs>>): Prisma__KinoQuizSessionClient<$Result.GetResult<Prisma.$KinoQuizSessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KinoQuizSession that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizSessionFindFirstOrThrowArgs} args - Arguments to find a KinoQuizSession
     * @example
     * // Get one KinoQuizSession
     * const kinoQuizSession = await prisma.kinoQuizSession.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends KinoQuizSessionFindFirstOrThrowArgs>(args?: SelectSubset<T, KinoQuizSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__KinoQuizSessionClient<$Result.GetResult<Prisma.$KinoQuizSessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more KinoQuizSessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizSessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all KinoQuizSessions
     * const kinoQuizSessions = await prisma.kinoQuizSession.findMany()
     * 
     * // Get first 10 KinoQuizSessions
     * const kinoQuizSessions = await prisma.kinoQuizSession.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const kinoQuizSessionWithIdOnly = await prisma.kinoQuizSession.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends KinoQuizSessionFindManyArgs>(args?: SelectSubset<T, KinoQuizSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KinoQuizSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a KinoQuizSession.
     * @param {KinoQuizSessionCreateArgs} args - Arguments to create a KinoQuizSession.
     * @example
     * // Create one KinoQuizSession
     * const KinoQuizSession = await prisma.kinoQuizSession.create({
     *   data: {
     *     // ... data to create a KinoQuizSession
     *   }
     * })
     * 
     */
    create<T extends KinoQuizSessionCreateArgs>(args: SelectSubset<T, KinoQuizSessionCreateArgs<ExtArgs>>): Prisma__KinoQuizSessionClient<$Result.GetResult<Prisma.$KinoQuizSessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many KinoQuizSessions.
     * @param {KinoQuizSessionCreateManyArgs} args - Arguments to create many KinoQuizSessions.
     * @example
     * // Create many KinoQuizSessions
     * const kinoQuizSession = await prisma.kinoQuizSession.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends KinoQuizSessionCreateManyArgs>(args?: SelectSubset<T, KinoQuizSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many KinoQuizSessions and returns the data saved in the database.
     * @param {KinoQuizSessionCreateManyAndReturnArgs} args - Arguments to create many KinoQuizSessions.
     * @example
     * // Create many KinoQuizSessions
     * const kinoQuizSession = await prisma.kinoQuizSession.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many KinoQuizSessions and only return the `id`
     * const kinoQuizSessionWithIdOnly = await prisma.kinoQuizSession.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends KinoQuizSessionCreateManyAndReturnArgs>(args?: SelectSubset<T, KinoQuizSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KinoQuizSessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a KinoQuizSession.
     * @param {KinoQuizSessionDeleteArgs} args - Arguments to delete one KinoQuizSession.
     * @example
     * // Delete one KinoQuizSession
     * const KinoQuizSession = await prisma.kinoQuizSession.delete({
     *   where: {
     *     // ... filter to delete one KinoQuizSession
     *   }
     * })
     * 
     */
    delete<T extends KinoQuizSessionDeleteArgs>(args: SelectSubset<T, KinoQuizSessionDeleteArgs<ExtArgs>>): Prisma__KinoQuizSessionClient<$Result.GetResult<Prisma.$KinoQuizSessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one KinoQuizSession.
     * @param {KinoQuizSessionUpdateArgs} args - Arguments to update one KinoQuizSession.
     * @example
     * // Update one KinoQuizSession
     * const kinoQuizSession = await prisma.kinoQuizSession.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends KinoQuizSessionUpdateArgs>(args: SelectSubset<T, KinoQuizSessionUpdateArgs<ExtArgs>>): Prisma__KinoQuizSessionClient<$Result.GetResult<Prisma.$KinoQuizSessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more KinoQuizSessions.
     * @param {KinoQuizSessionDeleteManyArgs} args - Arguments to filter KinoQuizSessions to delete.
     * @example
     * // Delete a few KinoQuizSessions
     * const { count } = await prisma.kinoQuizSession.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends KinoQuizSessionDeleteManyArgs>(args?: SelectSubset<T, KinoQuizSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KinoQuizSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizSessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many KinoQuizSessions
     * const kinoQuizSession = await prisma.kinoQuizSession.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends KinoQuizSessionUpdateManyArgs>(args: SelectSubset<T, KinoQuizSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KinoQuizSessions and returns the data updated in the database.
     * @param {KinoQuizSessionUpdateManyAndReturnArgs} args - Arguments to update many KinoQuizSessions.
     * @example
     * // Update many KinoQuizSessions
     * const kinoQuizSession = await prisma.kinoQuizSession.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more KinoQuizSessions and only return the `id`
     * const kinoQuizSessionWithIdOnly = await prisma.kinoQuizSession.updateManyAndReturn({
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
    updateManyAndReturn<T extends KinoQuizSessionUpdateManyAndReturnArgs>(args: SelectSubset<T, KinoQuizSessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KinoQuizSessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one KinoQuizSession.
     * @param {KinoQuizSessionUpsertArgs} args - Arguments to update or create a KinoQuizSession.
     * @example
     * // Update or create a KinoQuizSession
     * const kinoQuizSession = await prisma.kinoQuizSession.upsert({
     *   create: {
     *     // ... data to create a KinoQuizSession
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the KinoQuizSession we want to update
     *   }
     * })
     */
    upsert<T extends KinoQuizSessionUpsertArgs>(args: SelectSubset<T, KinoQuizSessionUpsertArgs<ExtArgs>>): Prisma__KinoQuizSessionClient<$Result.GetResult<Prisma.$KinoQuizSessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of KinoQuizSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizSessionCountArgs} args - Arguments to filter KinoQuizSessions to count.
     * @example
     * // Count the number of KinoQuizSessions
     * const count = await prisma.kinoQuizSession.count({
     *   where: {
     *     // ... the filter for the KinoQuizSessions we want to count
     *   }
     * })
    **/
    count<T extends KinoQuizSessionCountArgs>(
      args?: Subset<T, KinoQuizSessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], KinoQuizSessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a KinoQuizSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizSessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends KinoQuizSessionAggregateArgs>(args: Subset<T, KinoQuizSessionAggregateArgs>): Prisma.PrismaPromise<GetKinoQuizSessionAggregateType<T>>

    /**
     * Group by KinoQuizSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizSessionGroupByArgs} args - Group by arguments.
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
      T extends KinoQuizSessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: KinoQuizSessionGroupByArgs['orderBy'] }
        : { orderBy?: KinoQuizSessionGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, KinoQuizSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetKinoQuizSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the KinoQuizSession model
   */
  readonly fields: KinoQuizSessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for KinoQuizSession.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__KinoQuizSessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the KinoQuizSession model
   */
  interface KinoQuizSessionFieldRefs {
    readonly id: FieldRef<"KinoQuizSession", 'String'>
    readonly hostUsername: FieldRef<"KinoQuizSession", 'String'>
    readonly status: FieldRef<"KinoQuizSession", 'String'>
    readonly type: FieldRef<"KinoQuizSession", 'String'>
    readonly currentRound: FieldRef<"KinoQuizSession", 'Int'>
    readonly createdAt: FieldRef<"KinoQuizSession", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * KinoQuizSession findUnique
   */
  export type KinoQuizSessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizSession to fetch.
     */
    where: KinoQuizSessionWhereUniqueInput
  }

  /**
   * KinoQuizSession findUniqueOrThrow
   */
  export type KinoQuizSessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizSession to fetch.
     */
    where: KinoQuizSessionWhereUniqueInput
  }

  /**
   * KinoQuizSession findFirst
   */
  export type KinoQuizSessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizSession to fetch.
     */
    where?: KinoQuizSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizSessions to fetch.
     */
    orderBy?: KinoQuizSessionOrderByWithRelationInput | KinoQuizSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KinoQuizSessions.
     */
    cursor?: KinoQuizSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KinoQuizSessions.
     */
    distinct?: KinoQuizSessionScalarFieldEnum | KinoQuizSessionScalarFieldEnum[]
  }

  /**
   * KinoQuizSession findFirstOrThrow
   */
  export type KinoQuizSessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizSession to fetch.
     */
    where?: KinoQuizSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizSessions to fetch.
     */
    orderBy?: KinoQuizSessionOrderByWithRelationInput | KinoQuizSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KinoQuizSessions.
     */
    cursor?: KinoQuizSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KinoQuizSessions.
     */
    distinct?: KinoQuizSessionScalarFieldEnum | KinoQuizSessionScalarFieldEnum[]
  }

  /**
   * KinoQuizSession findMany
   */
  export type KinoQuizSessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizSessions to fetch.
     */
    where?: KinoQuizSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizSessions to fetch.
     */
    orderBy?: KinoQuizSessionOrderByWithRelationInput | KinoQuizSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing KinoQuizSessions.
     */
    cursor?: KinoQuizSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizSessions.
     */
    skip?: number
    distinct?: KinoQuizSessionScalarFieldEnum | KinoQuizSessionScalarFieldEnum[]
  }

  /**
   * KinoQuizSession create
   */
  export type KinoQuizSessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
    /**
     * The data needed to create a KinoQuizSession.
     */
    data: XOR<KinoQuizSessionCreateInput, KinoQuizSessionUncheckedCreateInput>
  }

  /**
   * KinoQuizSession createMany
   */
  export type KinoQuizSessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many KinoQuizSessions.
     */
    data: KinoQuizSessionCreateManyInput | KinoQuizSessionCreateManyInput[]
  }

  /**
   * KinoQuizSession createManyAndReturn
   */
  export type KinoQuizSessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
    /**
     * The data used to create many KinoQuizSessions.
     */
    data: KinoQuizSessionCreateManyInput | KinoQuizSessionCreateManyInput[]
  }

  /**
   * KinoQuizSession update
   */
  export type KinoQuizSessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
    /**
     * The data needed to update a KinoQuizSession.
     */
    data: XOR<KinoQuizSessionUpdateInput, KinoQuizSessionUncheckedUpdateInput>
    /**
     * Choose, which KinoQuizSession to update.
     */
    where: KinoQuizSessionWhereUniqueInput
  }

  /**
   * KinoQuizSession updateMany
   */
  export type KinoQuizSessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update KinoQuizSessions.
     */
    data: XOR<KinoQuizSessionUpdateManyMutationInput, KinoQuizSessionUncheckedUpdateManyInput>
    /**
     * Filter which KinoQuizSessions to update
     */
    where?: KinoQuizSessionWhereInput
    /**
     * Limit how many KinoQuizSessions to update.
     */
    limit?: number
  }

  /**
   * KinoQuizSession updateManyAndReturn
   */
  export type KinoQuizSessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
    /**
     * The data used to update KinoQuizSessions.
     */
    data: XOR<KinoQuizSessionUpdateManyMutationInput, KinoQuizSessionUncheckedUpdateManyInput>
    /**
     * Filter which KinoQuizSessions to update
     */
    where?: KinoQuizSessionWhereInput
    /**
     * Limit how many KinoQuizSessions to update.
     */
    limit?: number
  }

  /**
   * KinoQuizSession upsert
   */
  export type KinoQuizSessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
    /**
     * The filter to search for the KinoQuizSession to update in case it exists.
     */
    where: KinoQuizSessionWhereUniqueInput
    /**
     * In case the KinoQuizSession found by the `where` argument doesn't exist, create a new KinoQuizSession with this data.
     */
    create: XOR<KinoQuizSessionCreateInput, KinoQuizSessionUncheckedCreateInput>
    /**
     * In case the KinoQuizSession was found with the provided `where` argument, update it with this data.
     */
    update: XOR<KinoQuizSessionUpdateInput, KinoQuizSessionUncheckedUpdateInput>
  }

  /**
   * KinoQuizSession delete
   */
  export type KinoQuizSessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
    /**
     * Filter which KinoQuizSession to delete.
     */
    where: KinoQuizSessionWhereUniqueInput
  }

  /**
   * KinoQuizSession deleteMany
   */
  export type KinoQuizSessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KinoQuizSessions to delete
     */
    where?: KinoQuizSessionWhereInput
    /**
     * Limit how many KinoQuizSessions to delete.
     */
    limit?: number
  }

  /**
   * KinoQuizSession without action
   */
  export type KinoQuizSessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizSession
     */
    select?: KinoQuizSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizSession
     */
    omit?: KinoQuizSessionOmit<ExtArgs> | null
  }


  /**
   * Model KinoQuizScore
   */

  export type AggregateKinoQuizScore = {
    _count: KinoQuizScoreCountAggregateOutputType | null
    _avg: KinoQuizScoreAvgAggregateOutputType | null
    _sum: KinoQuizScoreSumAggregateOutputType | null
    _min: KinoQuizScoreMinAggregateOutputType | null
    _max: KinoQuizScoreMaxAggregateOutputType | null
  }

  export type KinoQuizScoreAvgAggregateOutputType = {
    score: number | null
  }

  export type KinoQuizScoreSumAggregateOutputType = {
    score: number | null
  }

  export type KinoQuizScoreMinAggregateOutputType = {
    id: string | null
    sessionId: string | null
    username: string | null
    score: number | null
    updatedAt: Date | null
  }

  export type KinoQuizScoreMaxAggregateOutputType = {
    id: string | null
    sessionId: string | null
    username: string | null
    score: number | null
    updatedAt: Date | null
  }

  export type KinoQuizScoreCountAggregateOutputType = {
    id: number
    sessionId: number
    username: number
    score: number
    updatedAt: number
    _all: number
  }


  export type KinoQuizScoreAvgAggregateInputType = {
    score?: true
  }

  export type KinoQuizScoreSumAggregateInputType = {
    score?: true
  }

  export type KinoQuizScoreMinAggregateInputType = {
    id?: true
    sessionId?: true
    username?: true
    score?: true
    updatedAt?: true
  }

  export type KinoQuizScoreMaxAggregateInputType = {
    id?: true
    sessionId?: true
    username?: true
    score?: true
    updatedAt?: true
  }

  export type KinoQuizScoreCountAggregateInputType = {
    id?: true
    sessionId?: true
    username?: true
    score?: true
    updatedAt?: true
    _all?: true
  }

  export type KinoQuizScoreAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KinoQuizScore to aggregate.
     */
    where?: KinoQuizScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizScores to fetch.
     */
    orderBy?: KinoQuizScoreOrderByWithRelationInput | KinoQuizScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: KinoQuizScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned KinoQuizScores
    **/
    _count?: true | KinoQuizScoreCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: KinoQuizScoreAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: KinoQuizScoreSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: KinoQuizScoreMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: KinoQuizScoreMaxAggregateInputType
  }

  export type GetKinoQuizScoreAggregateType<T extends KinoQuizScoreAggregateArgs> = {
        [P in keyof T & keyof AggregateKinoQuizScore]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateKinoQuizScore[P]>
      : GetScalarType<T[P], AggregateKinoQuizScore[P]>
  }




  export type KinoQuizScoreGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: KinoQuizScoreWhereInput
    orderBy?: KinoQuizScoreOrderByWithAggregationInput | KinoQuizScoreOrderByWithAggregationInput[]
    by: KinoQuizScoreScalarFieldEnum[] | KinoQuizScoreScalarFieldEnum
    having?: KinoQuizScoreScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: KinoQuizScoreCountAggregateInputType | true
    _avg?: KinoQuizScoreAvgAggregateInputType
    _sum?: KinoQuizScoreSumAggregateInputType
    _min?: KinoQuizScoreMinAggregateInputType
    _max?: KinoQuizScoreMaxAggregateInputType
  }

  export type KinoQuizScoreGroupByOutputType = {
    id: string
    sessionId: string
    username: string
    score: number
    updatedAt: Date
    _count: KinoQuizScoreCountAggregateOutputType | null
    _avg: KinoQuizScoreAvgAggregateOutputType | null
    _sum: KinoQuizScoreSumAggregateOutputType | null
    _min: KinoQuizScoreMinAggregateOutputType | null
    _max: KinoQuizScoreMaxAggregateOutputType | null
  }

  type GetKinoQuizScoreGroupByPayload<T extends KinoQuizScoreGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<KinoQuizScoreGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof KinoQuizScoreGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], KinoQuizScoreGroupByOutputType[P]>
            : GetScalarType<T[P], KinoQuizScoreGroupByOutputType[P]>
        }
      >
    >


  export type KinoQuizScoreSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    username?: boolean
    score?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["kinoQuizScore"]>

  export type KinoQuizScoreSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    username?: boolean
    score?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["kinoQuizScore"]>

  export type KinoQuizScoreSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    username?: boolean
    score?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["kinoQuizScore"]>

  export type KinoQuizScoreSelectScalar = {
    id?: boolean
    sessionId?: boolean
    username?: boolean
    score?: boolean
    updatedAt?: boolean
  }

  export type KinoQuizScoreOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sessionId" | "username" | "score" | "updatedAt", ExtArgs["result"]["kinoQuizScore"]>

  export type $KinoQuizScorePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "KinoQuizScore"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sessionId: string
      username: string
      score: number
      updatedAt: Date
    }, ExtArgs["result"]["kinoQuizScore"]>
    composites: {}
  }

  type KinoQuizScoreGetPayload<S extends boolean | null | undefined | KinoQuizScoreDefaultArgs> = $Result.GetResult<Prisma.$KinoQuizScorePayload, S>

  type KinoQuizScoreCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<KinoQuizScoreFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: KinoQuizScoreCountAggregateInputType | true
    }

  export interface KinoQuizScoreDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['KinoQuizScore'], meta: { name: 'KinoQuizScore' } }
    /**
     * Find zero or one KinoQuizScore that matches the filter.
     * @param {KinoQuizScoreFindUniqueArgs} args - Arguments to find a KinoQuizScore
     * @example
     * // Get one KinoQuizScore
     * const kinoQuizScore = await prisma.kinoQuizScore.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends KinoQuizScoreFindUniqueArgs>(args: SelectSubset<T, KinoQuizScoreFindUniqueArgs<ExtArgs>>): Prisma__KinoQuizScoreClient<$Result.GetResult<Prisma.$KinoQuizScorePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one KinoQuizScore that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {KinoQuizScoreFindUniqueOrThrowArgs} args - Arguments to find a KinoQuizScore
     * @example
     * // Get one KinoQuizScore
     * const kinoQuizScore = await prisma.kinoQuizScore.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends KinoQuizScoreFindUniqueOrThrowArgs>(args: SelectSubset<T, KinoQuizScoreFindUniqueOrThrowArgs<ExtArgs>>): Prisma__KinoQuizScoreClient<$Result.GetResult<Prisma.$KinoQuizScorePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KinoQuizScore that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizScoreFindFirstArgs} args - Arguments to find a KinoQuizScore
     * @example
     * // Get one KinoQuizScore
     * const kinoQuizScore = await prisma.kinoQuizScore.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends KinoQuizScoreFindFirstArgs>(args?: SelectSubset<T, KinoQuizScoreFindFirstArgs<ExtArgs>>): Prisma__KinoQuizScoreClient<$Result.GetResult<Prisma.$KinoQuizScorePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KinoQuizScore that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizScoreFindFirstOrThrowArgs} args - Arguments to find a KinoQuizScore
     * @example
     * // Get one KinoQuizScore
     * const kinoQuizScore = await prisma.kinoQuizScore.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends KinoQuizScoreFindFirstOrThrowArgs>(args?: SelectSubset<T, KinoQuizScoreFindFirstOrThrowArgs<ExtArgs>>): Prisma__KinoQuizScoreClient<$Result.GetResult<Prisma.$KinoQuizScorePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more KinoQuizScores that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizScoreFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all KinoQuizScores
     * const kinoQuizScores = await prisma.kinoQuizScore.findMany()
     * 
     * // Get first 10 KinoQuizScores
     * const kinoQuizScores = await prisma.kinoQuizScore.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const kinoQuizScoreWithIdOnly = await prisma.kinoQuizScore.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends KinoQuizScoreFindManyArgs>(args?: SelectSubset<T, KinoQuizScoreFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KinoQuizScorePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a KinoQuizScore.
     * @param {KinoQuizScoreCreateArgs} args - Arguments to create a KinoQuizScore.
     * @example
     * // Create one KinoQuizScore
     * const KinoQuizScore = await prisma.kinoQuizScore.create({
     *   data: {
     *     // ... data to create a KinoQuizScore
     *   }
     * })
     * 
     */
    create<T extends KinoQuizScoreCreateArgs>(args: SelectSubset<T, KinoQuizScoreCreateArgs<ExtArgs>>): Prisma__KinoQuizScoreClient<$Result.GetResult<Prisma.$KinoQuizScorePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many KinoQuizScores.
     * @param {KinoQuizScoreCreateManyArgs} args - Arguments to create many KinoQuizScores.
     * @example
     * // Create many KinoQuizScores
     * const kinoQuizScore = await prisma.kinoQuizScore.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends KinoQuizScoreCreateManyArgs>(args?: SelectSubset<T, KinoQuizScoreCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many KinoQuizScores and returns the data saved in the database.
     * @param {KinoQuizScoreCreateManyAndReturnArgs} args - Arguments to create many KinoQuizScores.
     * @example
     * // Create many KinoQuizScores
     * const kinoQuizScore = await prisma.kinoQuizScore.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many KinoQuizScores and only return the `id`
     * const kinoQuizScoreWithIdOnly = await prisma.kinoQuizScore.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends KinoQuizScoreCreateManyAndReturnArgs>(args?: SelectSubset<T, KinoQuizScoreCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KinoQuizScorePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a KinoQuizScore.
     * @param {KinoQuizScoreDeleteArgs} args - Arguments to delete one KinoQuizScore.
     * @example
     * // Delete one KinoQuizScore
     * const KinoQuizScore = await prisma.kinoQuizScore.delete({
     *   where: {
     *     // ... filter to delete one KinoQuizScore
     *   }
     * })
     * 
     */
    delete<T extends KinoQuizScoreDeleteArgs>(args: SelectSubset<T, KinoQuizScoreDeleteArgs<ExtArgs>>): Prisma__KinoQuizScoreClient<$Result.GetResult<Prisma.$KinoQuizScorePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one KinoQuizScore.
     * @param {KinoQuizScoreUpdateArgs} args - Arguments to update one KinoQuizScore.
     * @example
     * // Update one KinoQuizScore
     * const kinoQuizScore = await prisma.kinoQuizScore.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends KinoQuizScoreUpdateArgs>(args: SelectSubset<T, KinoQuizScoreUpdateArgs<ExtArgs>>): Prisma__KinoQuizScoreClient<$Result.GetResult<Prisma.$KinoQuizScorePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more KinoQuizScores.
     * @param {KinoQuizScoreDeleteManyArgs} args - Arguments to filter KinoQuizScores to delete.
     * @example
     * // Delete a few KinoQuizScores
     * const { count } = await prisma.kinoQuizScore.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends KinoQuizScoreDeleteManyArgs>(args?: SelectSubset<T, KinoQuizScoreDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KinoQuizScores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizScoreUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many KinoQuizScores
     * const kinoQuizScore = await prisma.kinoQuizScore.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends KinoQuizScoreUpdateManyArgs>(args: SelectSubset<T, KinoQuizScoreUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KinoQuizScores and returns the data updated in the database.
     * @param {KinoQuizScoreUpdateManyAndReturnArgs} args - Arguments to update many KinoQuizScores.
     * @example
     * // Update many KinoQuizScores
     * const kinoQuizScore = await prisma.kinoQuizScore.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more KinoQuizScores and only return the `id`
     * const kinoQuizScoreWithIdOnly = await prisma.kinoQuizScore.updateManyAndReturn({
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
    updateManyAndReturn<T extends KinoQuizScoreUpdateManyAndReturnArgs>(args: SelectSubset<T, KinoQuizScoreUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KinoQuizScorePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one KinoQuizScore.
     * @param {KinoQuizScoreUpsertArgs} args - Arguments to update or create a KinoQuizScore.
     * @example
     * // Update or create a KinoQuizScore
     * const kinoQuizScore = await prisma.kinoQuizScore.upsert({
     *   create: {
     *     // ... data to create a KinoQuizScore
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the KinoQuizScore we want to update
     *   }
     * })
     */
    upsert<T extends KinoQuizScoreUpsertArgs>(args: SelectSubset<T, KinoQuizScoreUpsertArgs<ExtArgs>>): Prisma__KinoQuizScoreClient<$Result.GetResult<Prisma.$KinoQuizScorePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of KinoQuizScores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizScoreCountArgs} args - Arguments to filter KinoQuizScores to count.
     * @example
     * // Count the number of KinoQuizScores
     * const count = await prisma.kinoQuizScore.count({
     *   where: {
     *     // ... the filter for the KinoQuizScores we want to count
     *   }
     * })
    **/
    count<T extends KinoQuizScoreCountArgs>(
      args?: Subset<T, KinoQuizScoreCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], KinoQuizScoreCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a KinoQuizScore.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizScoreAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends KinoQuizScoreAggregateArgs>(args: Subset<T, KinoQuizScoreAggregateArgs>): Prisma.PrismaPromise<GetKinoQuizScoreAggregateType<T>>

    /**
     * Group by KinoQuizScore.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KinoQuizScoreGroupByArgs} args - Group by arguments.
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
      T extends KinoQuizScoreGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: KinoQuizScoreGroupByArgs['orderBy'] }
        : { orderBy?: KinoQuizScoreGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, KinoQuizScoreGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetKinoQuizScoreGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the KinoQuizScore model
   */
  readonly fields: KinoQuizScoreFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for KinoQuizScore.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__KinoQuizScoreClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the KinoQuizScore model
   */
  interface KinoQuizScoreFieldRefs {
    readonly id: FieldRef<"KinoQuizScore", 'String'>
    readonly sessionId: FieldRef<"KinoQuizScore", 'String'>
    readonly username: FieldRef<"KinoQuizScore", 'String'>
    readonly score: FieldRef<"KinoQuizScore", 'Int'>
    readonly updatedAt: FieldRef<"KinoQuizScore", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * KinoQuizScore findUnique
   */
  export type KinoQuizScoreFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizScore to fetch.
     */
    where: KinoQuizScoreWhereUniqueInput
  }

  /**
   * KinoQuizScore findUniqueOrThrow
   */
  export type KinoQuizScoreFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizScore to fetch.
     */
    where: KinoQuizScoreWhereUniqueInput
  }

  /**
   * KinoQuizScore findFirst
   */
  export type KinoQuizScoreFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizScore to fetch.
     */
    where?: KinoQuizScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizScores to fetch.
     */
    orderBy?: KinoQuizScoreOrderByWithRelationInput | KinoQuizScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KinoQuizScores.
     */
    cursor?: KinoQuizScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KinoQuizScores.
     */
    distinct?: KinoQuizScoreScalarFieldEnum | KinoQuizScoreScalarFieldEnum[]
  }

  /**
   * KinoQuizScore findFirstOrThrow
   */
  export type KinoQuizScoreFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizScore to fetch.
     */
    where?: KinoQuizScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizScores to fetch.
     */
    orderBy?: KinoQuizScoreOrderByWithRelationInput | KinoQuizScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KinoQuizScores.
     */
    cursor?: KinoQuizScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KinoQuizScores.
     */
    distinct?: KinoQuizScoreScalarFieldEnum | KinoQuizScoreScalarFieldEnum[]
  }

  /**
   * KinoQuizScore findMany
   */
  export type KinoQuizScoreFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
    /**
     * Filter, which KinoQuizScores to fetch.
     */
    where?: KinoQuizScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KinoQuizScores to fetch.
     */
    orderBy?: KinoQuizScoreOrderByWithRelationInput | KinoQuizScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing KinoQuizScores.
     */
    cursor?: KinoQuizScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KinoQuizScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KinoQuizScores.
     */
    skip?: number
    distinct?: KinoQuizScoreScalarFieldEnum | KinoQuizScoreScalarFieldEnum[]
  }

  /**
   * KinoQuizScore create
   */
  export type KinoQuizScoreCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
    /**
     * The data needed to create a KinoQuizScore.
     */
    data: XOR<KinoQuizScoreCreateInput, KinoQuizScoreUncheckedCreateInput>
  }

  /**
   * KinoQuizScore createMany
   */
  export type KinoQuizScoreCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many KinoQuizScores.
     */
    data: KinoQuizScoreCreateManyInput | KinoQuizScoreCreateManyInput[]
  }

  /**
   * KinoQuizScore createManyAndReturn
   */
  export type KinoQuizScoreCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
    /**
     * The data used to create many KinoQuizScores.
     */
    data: KinoQuizScoreCreateManyInput | KinoQuizScoreCreateManyInput[]
  }

  /**
   * KinoQuizScore update
   */
  export type KinoQuizScoreUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
    /**
     * The data needed to update a KinoQuizScore.
     */
    data: XOR<KinoQuizScoreUpdateInput, KinoQuizScoreUncheckedUpdateInput>
    /**
     * Choose, which KinoQuizScore to update.
     */
    where: KinoQuizScoreWhereUniqueInput
  }

  /**
   * KinoQuizScore updateMany
   */
  export type KinoQuizScoreUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update KinoQuizScores.
     */
    data: XOR<KinoQuizScoreUpdateManyMutationInput, KinoQuizScoreUncheckedUpdateManyInput>
    /**
     * Filter which KinoQuizScores to update
     */
    where?: KinoQuizScoreWhereInput
    /**
     * Limit how many KinoQuizScores to update.
     */
    limit?: number
  }

  /**
   * KinoQuizScore updateManyAndReturn
   */
  export type KinoQuizScoreUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
    /**
     * The data used to update KinoQuizScores.
     */
    data: XOR<KinoQuizScoreUpdateManyMutationInput, KinoQuizScoreUncheckedUpdateManyInput>
    /**
     * Filter which KinoQuizScores to update
     */
    where?: KinoQuizScoreWhereInput
    /**
     * Limit how many KinoQuizScores to update.
     */
    limit?: number
  }

  /**
   * KinoQuizScore upsert
   */
  export type KinoQuizScoreUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
    /**
     * The filter to search for the KinoQuizScore to update in case it exists.
     */
    where: KinoQuizScoreWhereUniqueInput
    /**
     * In case the KinoQuizScore found by the `where` argument doesn't exist, create a new KinoQuizScore with this data.
     */
    create: XOR<KinoQuizScoreCreateInput, KinoQuizScoreUncheckedCreateInput>
    /**
     * In case the KinoQuizScore was found with the provided `where` argument, update it with this data.
     */
    update: XOR<KinoQuizScoreUpdateInput, KinoQuizScoreUncheckedUpdateInput>
  }

  /**
   * KinoQuizScore delete
   */
  export type KinoQuizScoreDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
    /**
     * Filter which KinoQuizScore to delete.
     */
    where: KinoQuizScoreWhereUniqueInput
  }

  /**
   * KinoQuizScore deleteMany
   */
  export type KinoQuizScoreDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KinoQuizScores to delete
     */
    where?: KinoQuizScoreWhereInput
    /**
     * Limit how many KinoQuizScores to delete.
     */
    limit?: number
  }

  /**
   * KinoQuizScore without action
   */
  export type KinoQuizScoreDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KinoQuizScore
     */
    select?: KinoQuizScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KinoQuizScore
     */
    omit?: KinoQuizScoreOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const KinoQuizMovieScalarFieldEnum: {
    id: 'id',
    title: 'title',
    title_ru: 'title_ru',
    imageUrl: 'imageUrl',
    type: 'type',
    difficulty: 'difficulty',
    year: 'year',
    createdAt: 'createdAt'
  };

  export type KinoQuizMovieScalarFieldEnum = (typeof KinoQuizMovieScalarFieldEnum)[keyof typeof KinoQuizMovieScalarFieldEnum]


  export const KinoQuizSessionScalarFieldEnum: {
    id: 'id',
    hostUsername: 'hostUsername',
    status: 'status',
    type: 'type',
    currentRound: 'currentRound',
    createdAt: 'createdAt'
  };

  export type KinoQuizSessionScalarFieldEnum = (typeof KinoQuizSessionScalarFieldEnum)[keyof typeof KinoQuizSessionScalarFieldEnum]


  export const KinoQuizScoreScalarFieldEnum: {
    id: 'id',
    sessionId: 'sessionId',
    username: 'username',
    score: 'score',
    updatedAt: 'updatedAt'
  };

  export type KinoQuizScoreScalarFieldEnum = (typeof KinoQuizScoreScalarFieldEnum)[keyof typeof KinoQuizScoreScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


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
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type KinoQuizMovieWhereInput = {
    AND?: KinoQuizMovieWhereInput | KinoQuizMovieWhereInput[]
    OR?: KinoQuizMovieWhereInput[]
    NOT?: KinoQuizMovieWhereInput | KinoQuizMovieWhereInput[]
    id?: StringFilter<"KinoQuizMovie"> | string
    title?: StringFilter<"KinoQuizMovie"> | string
    title_ru?: StringFilter<"KinoQuizMovie"> | string
    imageUrl?: StringFilter<"KinoQuizMovie"> | string
    type?: StringFilter<"KinoQuizMovie"> | string
    difficulty?: StringFilter<"KinoQuizMovie"> | string
    year?: IntNullableFilter<"KinoQuizMovie"> | number | null
    createdAt?: DateTimeFilter<"KinoQuizMovie"> | Date | string
  }

  export type KinoQuizMovieOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    title_ru?: SortOrder
    imageUrl?: SortOrder
    type?: SortOrder
    difficulty?: SortOrder
    year?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type KinoQuizMovieWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: KinoQuizMovieWhereInput | KinoQuizMovieWhereInput[]
    OR?: KinoQuizMovieWhereInput[]
    NOT?: KinoQuizMovieWhereInput | KinoQuizMovieWhereInput[]
    title?: StringFilter<"KinoQuizMovie"> | string
    title_ru?: StringFilter<"KinoQuizMovie"> | string
    imageUrl?: StringFilter<"KinoQuizMovie"> | string
    type?: StringFilter<"KinoQuizMovie"> | string
    difficulty?: StringFilter<"KinoQuizMovie"> | string
    year?: IntNullableFilter<"KinoQuizMovie"> | number | null
    createdAt?: DateTimeFilter<"KinoQuizMovie"> | Date | string
  }, "id">

  export type KinoQuizMovieOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    title_ru?: SortOrder
    imageUrl?: SortOrder
    type?: SortOrder
    difficulty?: SortOrder
    year?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: KinoQuizMovieCountOrderByAggregateInput
    _avg?: KinoQuizMovieAvgOrderByAggregateInput
    _max?: KinoQuizMovieMaxOrderByAggregateInput
    _min?: KinoQuizMovieMinOrderByAggregateInput
    _sum?: KinoQuizMovieSumOrderByAggregateInput
  }

  export type KinoQuizMovieScalarWhereWithAggregatesInput = {
    AND?: KinoQuizMovieScalarWhereWithAggregatesInput | KinoQuizMovieScalarWhereWithAggregatesInput[]
    OR?: KinoQuizMovieScalarWhereWithAggregatesInput[]
    NOT?: KinoQuizMovieScalarWhereWithAggregatesInput | KinoQuizMovieScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"KinoQuizMovie"> | string
    title?: StringWithAggregatesFilter<"KinoQuizMovie"> | string
    title_ru?: StringWithAggregatesFilter<"KinoQuizMovie"> | string
    imageUrl?: StringWithAggregatesFilter<"KinoQuizMovie"> | string
    type?: StringWithAggregatesFilter<"KinoQuizMovie"> | string
    difficulty?: StringWithAggregatesFilter<"KinoQuizMovie"> | string
    year?: IntNullableWithAggregatesFilter<"KinoQuizMovie"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"KinoQuizMovie"> | Date | string
  }

  export type KinoQuizSessionWhereInput = {
    AND?: KinoQuizSessionWhereInput | KinoQuizSessionWhereInput[]
    OR?: KinoQuizSessionWhereInput[]
    NOT?: KinoQuizSessionWhereInput | KinoQuizSessionWhereInput[]
    id?: StringFilter<"KinoQuizSession"> | string
    hostUsername?: StringFilter<"KinoQuizSession"> | string
    status?: StringFilter<"KinoQuizSession"> | string
    type?: StringFilter<"KinoQuizSession"> | string
    currentRound?: IntFilter<"KinoQuizSession"> | number
    createdAt?: DateTimeFilter<"KinoQuizSession"> | Date | string
  }

  export type KinoQuizSessionOrderByWithRelationInput = {
    id?: SortOrder
    hostUsername?: SortOrder
    status?: SortOrder
    type?: SortOrder
    currentRound?: SortOrder
    createdAt?: SortOrder
  }

  export type KinoQuizSessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: KinoQuizSessionWhereInput | KinoQuizSessionWhereInput[]
    OR?: KinoQuizSessionWhereInput[]
    NOT?: KinoQuizSessionWhereInput | KinoQuizSessionWhereInput[]
    hostUsername?: StringFilter<"KinoQuizSession"> | string
    status?: StringFilter<"KinoQuizSession"> | string
    type?: StringFilter<"KinoQuizSession"> | string
    currentRound?: IntFilter<"KinoQuizSession"> | number
    createdAt?: DateTimeFilter<"KinoQuizSession"> | Date | string
  }, "id">

  export type KinoQuizSessionOrderByWithAggregationInput = {
    id?: SortOrder
    hostUsername?: SortOrder
    status?: SortOrder
    type?: SortOrder
    currentRound?: SortOrder
    createdAt?: SortOrder
    _count?: KinoQuizSessionCountOrderByAggregateInput
    _avg?: KinoQuizSessionAvgOrderByAggregateInput
    _max?: KinoQuizSessionMaxOrderByAggregateInput
    _min?: KinoQuizSessionMinOrderByAggregateInput
    _sum?: KinoQuizSessionSumOrderByAggregateInput
  }

  export type KinoQuizSessionScalarWhereWithAggregatesInput = {
    AND?: KinoQuizSessionScalarWhereWithAggregatesInput | KinoQuizSessionScalarWhereWithAggregatesInput[]
    OR?: KinoQuizSessionScalarWhereWithAggregatesInput[]
    NOT?: KinoQuizSessionScalarWhereWithAggregatesInput | KinoQuizSessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"KinoQuizSession"> | string
    hostUsername?: StringWithAggregatesFilter<"KinoQuizSession"> | string
    status?: StringWithAggregatesFilter<"KinoQuizSession"> | string
    type?: StringWithAggregatesFilter<"KinoQuizSession"> | string
    currentRound?: IntWithAggregatesFilter<"KinoQuizSession"> | number
    createdAt?: DateTimeWithAggregatesFilter<"KinoQuizSession"> | Date | string
  }

  export type KinoQuizScoreWhereInput = {
    AND?: KinoQuizScoreWhereInput | KinoQuizScoreWhereInput[]
    OR?: KinoQuizScoreWhereInput[]
    NOT?: KinoQuizScoreWhereInput | KinoQuizScoreWhereInput[]
    id?: StringFilter<"KinoQuizScore"> | string
    sessionId?: StringFilter<"KinoQuizScore"> | string
    username?: StringFilter<"KinoQuizScore"> | string
    score?: IntFilter<"KinoQuizScore"> | number
    updatedAt?: DateTimeFilter<"KinoQuizScore"> | Date | string
  }

  export type KinoQuizScoreOrderByWithRelationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    username?: SortOrder
    score?: SortOrder
    updatedAt?: SortOrder
  }

  export type KinoQuizScoreWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sessionId_username?: KinoQuizScoreSessionIdUsernameCompoundUniqueInput
    AND?: KinoQuizScoreWhereInput | KinoQuizScoreWhereInput[]
    OR?: KinoQuizScoreWhereInput[]
    NOT?: KinoQuizScoreWhereInput | KinoQuizScoreWhereInput[]
    sessionId?: StringFilter<"KinoQuizScore"> | string
    username?: StringFilter<"KinoQuizScore"> | string
    score?: IntFilter<"KinoQuizScore"> | number
    updatedAt?: DateTimeFilter<"KinoQuizScore"> | Date | string
  }, "id" | "sessionId_username">

  export type KinoQuizScoreOrderByWithAggregationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    username?: SortOrder
    score?: SortOrder
    updatedAt?: SortOrder
    _count?: KinoQuizScoreCountOrderByAggregateInput
    _avg?: KinoQuizScoreAvgOrderByAggregateInput
    _max?: KinoQuizScoreMaxOrderByAggregateInput
    _min?: KinoQuizScoreMinOrderByAggregateInput
    _sum?: KinoQuizScoreSumOrderByAggregateInput
  }

  export type KinoQuizScoreScalarWhereWithAggregatesInput = {
    AND?: KinoQuizScoreScalarWhereWithAggregatesInput | KinoQuizScoreScalarWhereWithAggregatesInput[]
    OR?: KinoQuizScoreScalarWhereWithAggregatesInput[]
    NOT?: KinoQuizScoreScalarWhereWithAggregatesInput | KinoQuizScoreScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"KinoQuizScore"> | string
    sessionId?: StringWithAggregatesFilter<"KinoQuizScore"> | string
    username?: StringWithAggregatesFilter<"KinoQuizScore"> | string
    score?: IntWithAggregatesFilter<"KinoQuizScore"> | number
    updatedAt?: DateTimeWithAggregatesFilter<"KinoQuizScore"> | Date | string
  }

  export type KinoQuizMovieCreateInput = {
    id?: string
    title: string
    title_ru: string
    imageUrl: string
    type: string
    difficulty: string
    year?: number | null
    createdAt?: Date | string
  }

  export type KinoQuizMovieUncheckedCreateInput = {
    id?: string
    title: string
    title_ru: string
    imageUrl: string
    type: string
    difficulty: string
    year?: number | null
    createdAt?: Date | string
  }

  export type KinoQuizMovieUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    title_ru?: StringFieldUpdateOperationsInput | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    difficulty?: StringFieldUpdateOperationsInput | string
    year?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KinoQuizMovieUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    title_ru?: StringFieldUpdateOperationsInput | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    difficulty?: StringFieldUpdateOperationsInput | string
    year?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KinoQuizMovieCreateManyInput = {
    id?: string
    title: string
    title_ru: string
    imageUrl: string
    type: string
    difficulty: string
    year?: number | null
    createdAt?: Date | string
  }

  export type KinoQuizMovieUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    title_ru?: StringFieldUpdateOperationsInput | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    difficulty?: StringFieldUpdateOperationsInput | string
    year?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KinoQuizMovieUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    title_ru?: StringFieldUpdateOperationsInput | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    difficulty?: StringFieldUpdateOperationsInput | string
    year?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KinoQuizSessionCreateInput = {
    id?: string
    hostUsername: string
    status: string
    type: string
    currentRound?: number
    createdAt?: Date | string
  }

  export type KinoQuizSessionUncheckedCreateInput = {
    id?: string
    hostUsername: string
    status: string
    type: string
    currentRound?: number
    createdAt?: Date | string
  }

  export type KinoQuizSessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostUsername?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    currentRound?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KinoQuizSessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostUsername?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    currentRound?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KinoQuizSessionCreateManyInput = {
    id?: string
    hostUsername: string
    status: string
    type: string
    currentRound?: number
    createdAt?: Date | string
  }

  export type KinoQuizSessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostUsername?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    currentRound?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KinoQuizSessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostUsername?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    currentRound?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KinoQuizScoreCreateInput = {
    id?: string
    sessionId: string
    username: string
    score: number
    updatedAt?: Date | string
  }

  export type KinoQuizScoreUncheckedCreateInput = {
    id?: string
    sessionId: string
    username: string
    score: number
    updatedAt?: Date | string
  }

  export type KinoQuizScoreUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KinoQuizScoreUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KinoQuizScoreCreateManyInput = {
    id?: string
    sessionId: string
    username: string
    score: number
    updatedAt?: Date | string
  }

  export type KinoQuizScoreUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KinoQuizScoreUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type KinoQuizMovieCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    title_ru?: SortOrder
    imageUrl?: SortOrder
    type?: SortOrder
    difficulty?: SortOrder
    year?: SortOrder
    createdAt?: SortOrder
  }

  export type KinoQuizMovieAvgOrderByAggregateInput = {
    year?: SortOrder
  }

  export type KinoQuizMovieMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    title_ru?: SortOrder
    imageUrl?: SortOrder
    type?: SortOrder
    difficulty?: SortOrder
    year?: SortOrder
    createdAt?: SortOrder
  }

  export type KinoQuizMovieMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    title_ru?: SortOrder
    imageUrl?: SortOrder
    type?: SortOrder
    difficulty?: SortOrder
    year?: SortOrder
    createdAt?: SortOrder
  }

  export type KinoQuizMovieSumOrderByAggregateInput = {
    year?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
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

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
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

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type KinoQuizSessionCountOrderByAggregateInput = {
    id?: SortOrder
    hostUsername?: SortOrder
    status?: SortOrder
    type?: SortOrder
    currentRound?: SortOrder
    createdAt?: SortOrder
  }

  export type KinoQuizSessionAvgOrderByAggregateInput = {
    currentRound?: SortOrder
  }

  export type KinoQuizSessionMaxOrderByAggregateInput = {
    id?: SortOrder
    hostUsername?: SortOrder
    status?: SortOrder
    type?: SortOrder
    currentRound?: SortOrder
    createdAt?: SortOrder
  }

  export type KinoQuizSessionMinOrderByAggregateInput = {
    id?: SortOrder
    hostUsername?: SortOrder
    status?: SortOrder
    type?: SortOrder
    currentRound?: SortOrder
    createdAt?: SortOrder
  }

  export type KinoQuizSessionSumOrderByAggregateInput = {
    currentRound?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
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

  export type KinoQuizScoreSessionIdUsernameCompoundUniqueInput = {
    sessionId: string
    username: string
  }

  export type KinoQuizScoreCountOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    username?: SortOrder
    score?: SortOrder
    updatedAt?: SortOrder
  }

  export type KinoQuizScoreAvgOrderByAggregateInput = {
    score?: SortOrder
  }

  export type KinoQuizScoreMaxOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    username?: SortOrder
    score?: SortOrder
    updatedAt?: SortOrder
  }

  export type KinoQuizScoreMinOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    username?: SortOrder
    score?: SortOrder
    updatedAt?: SortOrder
  }

  export type KinoQuizScoreSumOrderByAggregateInput = {
    score?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
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
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
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
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
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
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
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