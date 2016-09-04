# Angular 2 JSON API

A lightweight Angular 2 adapter for [JSON API](http://jsonapi.org/)

[![Angular 2 Style Guide](https://mgechev.github.io/angular2-style-guide/images/badge.svg)](https://angular.io/styleguide) [![Dependency Status](https://david-dm.org/ghidoz/angular2-jsonapi.svg)](https://david-dm.org/ghidoz/angular2-jsonapi) [![devDependency Status](https://david-dm.org/ghidoz/angular2-jsonapi/dev-status.svg)](https://david-dm.org/ghidoz/angular2-jsonapi#info=devDependencies) [![npm version](https://badge.fury.io/js/angular2-jsonapi.svg)](https://badge.fury.io/js/angular2-jsonapi)

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
    - [Configuration](#configuration)
    - [Finding Records](#finding-records)
        - [Querying for Multiple Records](#querying-for-multiple-records)
        - [Retrieving a Single Record](#retrieving-a-single-record)
    - [Creating, Updating and Deleting](#creating-updating-and-deleting)
        - [Creating Records](#creating-records)
        - [Persisting Records](#persisting-records)
        - [Relationships](#relationships)
    - [Custom Headers](#custom-headers)
- [TODO](#todo)
- [Development](#development)
- [License](#licence)


## Installation

To install this library, run:
```bash
$ npm install angular2-jsonapi --save
```

**Note**: If you use [Angular-CLI](https://github.com/angular/angular-cli) with SystemJS, add the package (and its dependencies) to `system-config.ts`:
```typescript
const map: any = {
  'underscore': 'vendor/underscore',
  'angular2-jsonapi': 'vendor/angular2-jsonapi/dist',
  'reflect-metadata': 'vendor/reflect-metadata/Reflect.js',
  'crypto': '@empty'
};

const packages: any = {
  'underscore': {format: 'cjs', defaultExtension: 'js', main: 'underscore.js'},
  'angular2-jsonapi': {defaultExtension: 'js', main: 'index.js'}
};
```

and to `angular-cli-build.js`:
```javascript
vendorNpmFiles: [
    // ...
    'underscore/underscore.js',
    'angular2-jsonapi/dist/**/*.+(ts|js|js.map)'
]
```

If you use the [Angular-CLI Webpack version](https://github.com/angular/angular-cli/blob/master/WEBPACK_UPDATE.md), just skip to the following configuration step.

Add the `JsonApiModule` to your app module imports:
```typescript
import { JsonApiModule } from 'angular2-jsonapi';

@NgModule({
  imports: [
    BrowserModule,
    JsonApiModule
  ],
  declarations: [
    AppComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

If you are still using Angular2 RC4, you can just add the library's `PROVIDERS` to your bootstrap dependencies:

```typescript
import { PROVIDERS } from 'angular2-jsonapi';

bootstrap(AppComponent, [
  PROVIDERS
]);
```

## Usage

### Configuration

Firstly, create your `Datastore` service:
- Extend the `JsonApiDatastore` class
- Decorate it with `@JsonApiDatastoreConfig`, set the `baseUrl` for your APIs and map your models
- Pass the `Http` depencency to the parent constructor.

```typescript
import { JsonApiDatastoreConfig, JsonApiDatastore } from 'angular2-jsonapi';

@Injectable()
@JsonApiDatastoreConfig({
  baseUrl: 'http://localhost:8000/v1/',
  models: {
    posts: Post,
    comments: Comment,
    users: User
  }
})
export class Datastore extends JsonApiDatastore {

    constructor(http: Http) {
        super(http);
    }

}
```

Then set up your models:
- Extend the `JsonApiModel` class
- Decorate it with `@JsonApiModelConfig`, passing the `type`
- Decorate the relationships attributes with `@HasMany` and `@BelongsTo`

```typescript
import { JsonApiModelConfig, JsonApiModel, HasMany, BelongsTo } from 'angular2-jsonapi';

@JsonApiModelConfig({
    type: 'posts'
})
export class Post extends JsonApiModel {

    title: string;
    content: string;

    @HasMany()
    comments: Comment[];
}

@JsonApiModelConfig({
    type: 'comments'
})
export class Comment extends JsonApiModel {

    title: string;
    
    @BelongsTo()
    post: Post;

	@BelongsTo()
    user: User;
}

@JsonApiModelConfig({
    type: 'users'
})
export class User extends JsonApiModel {

    name: string;
    // ...
}
```

### Finding Records

#### Querying for Multiple Records

Now, you can use your `Datastore` in order to query your API with the `query()` method:
- The first argument is the type of object you want to query.
- The second argument is the list of params: write them in JSON format and they will be serialized.

```typescript
// ...
constructor(private datastore: Datastore) { }

getPosts(){
    this.datastore.query(Post, {
        page: { size: 10, number: 1},
        include: 'comments'
    }).subscribe(
        (posts: Post[]) => console.log(posts)
    );
}
```

You will get an array of objects where every mapped relationship will be automatically resolved:
```javascript
[
    Post{
        id: 1,
        title: 'My post',
        content: 'My content',
        comments: [
            Comment{
                id: 1,
                // ...
            },
            Comment{
                id: 2,
                // ...
            }
        ]
    },
    // ...
]
```

Use `peekAll()` to retrieve all of the records for a given type that are already loaded into the store, without making a network request:

```typescript
let posts = this.datastore.peekAll(Post);
```


#### Retrieving a Single Record

Use `findRecord()` to retrieve a record by its type and ID:

```typescript
this.datastore.findRecord(Post, '1').subscribe(
    (post: Post) => console.log(post)
);
```

You can also pass the options:

```typescript
this.datastore.findRecord(Post, '1', {
    include: 'comments'
}).subscribe(
    (post: Post) => console.log(post)
);
```

Use `peekRecord()` to retrieve a record by its type and ID, without making a network request. This will return the record only if it is already present in the store:

```typescript
let post = this.datastore.peekRecord(Post, '1');
```

### Creating, Updating and Deleting 

#### Creating Records

You can create records by calling the `createRecord()` method on the datastore:
- The first argument is the type of object you want to create.
- The second is a JSON with the object attributes.

```typescript
this.datastore.createRecord(Post, {
    title: 'My post',
    content: 'My content'
});
```

#### Persisting Records

Records are persisted on a per-instance basis. Call `save()` on any instance of `JsonApiModel` and it will make a network request.

```typescript
let post = this.datastore.createRecord(Post, {
    title: 'My post',
    content: 'My content'
});

post.save();
```

The `save()` method will return an `Observer` that you can subscribe:

```typescript
post.save().subscribe(
    (post: Post) => console.log(post)
);
```

#### Relationships

If the object you want to create has a **one-to-many** relationship, you can do this:

```typescript
let comment = this.datastore.createRecord(Comment, {
    title: 'My comment',
    post: post
});
```

where `post` is an object of type `Post`, previously retrieved from the API.

If you want to include a relationship when creating a record to have it parsed in the response, you can pass the `params` object to the `save()` method:

```typescript
comment.save({
	include: 'user'
}).subscribe(
    (comment: Comment) => console.log(comment)
);
```

### Custom Headers

By default, the library adds these headers, according to the [JSON API MIME Types](http://jsonapi.org/#mime-types):

```
Accept: application/vnd.api+json
Content-Type: application/vnd.api+json
```

You can also add your custom headers to be appended to each http call:

```typescript
this.datastore.headers = new Headers({'Authorization': 'Bearer ' + accessToken});
```

Or you can pass the headers as last argument of any datastore call method:

```typescript
this.datastore.query(Post, {
    include: 'comments'
}, new Headers({'Authorization': 'Bearer ' + accessToken}));
```

and in the `save()` method:

```typescript
post.save({}, new Headers({'Authorization': 'Bearer ' + accessToken}));
```


## TODO
- Implement everything from the [JSON API](http://jsonapi.org/) specific.
- Add unit testing and E2E testing


## Development

To generate all `*.js`, `*.js.map` and `*.d.ts` files:

```bash
$ npm run tsc
```

To lint all `*.ts` files:

```bash
$ npm run lint
```

## Thanks

This library is inspired by the draft of [this never implemented library](https://github.com/beauby/angular2-jsonapi).

## License

MIT © [Daniele Ghidoli](http://danieleghidoli.it)