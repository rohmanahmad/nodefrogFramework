## NodefrogFramework

### Apa Itu Nodefrog Framework??

```
Nodefrog Framework adalah sebuah API framework untuk manajemen mongodb data. Dengan menggunakan framework ini kita tidak perlu repot untuk mengurusi script yg ada pada server nodejs karena semua API akan terbuat dengan otomatis sesuai dengan config yg diset pada file config.js pada bagian models
```

### Instalasi Nodefrog Framework

```
$ git clone https://github.com/rohmanahmad/nodefrogFramework
$ cd nodefrogFramework
$ npm install
$ setup connectionURI & model pada config.js
$ npm run start
```

### Cara Konfigurasi Mongodb connection & Models pada config.js

* buka config.js maka akan terlihat seperti dibawah ini
```
module.exports = {
    db: {
        mongo: 'mongodb://HOST:PORT/YOUR_DB_NAME'
    },
    models: {
        Model1: {
            field1: String,
            field2: Number,
            field3: Boolean,
            ...
            fieldn: any object
        }
    }
}
```

* pada bagian db.mongo ubah sesuai dengan connection URI pada masing-masing server mongo. contoh:
```
module.exports = {
    db: {
        mongo: 'mongodb://localhost:27017/nodefrogframework'
    },
    ...
}
```

* untuk setup models, tambahkan object model sesuai dengan nama collection masing-masing. nama collection akan otomatis diubah ke lowercase semua

* semua selesai dengan sempurna, api siap dijalankan.

* terima kasih

### Route List

```
POST /:model/find        : find one or many on current model
POST /:model/findOne     : find one on current model
POST /:model/create      : create one or many on current model
POST /:model/updateOne   : update one on current model
POST /:model/updateMany  : update many on current model
POST /:model/deleteOne   : delete one on current model
POST /:model/deleteMany  : delete many on current model
POST /:model/aggregate   : run aggregate on current model
```

### Spesifikasi Route

#### [POST] /:model/find
->  digunakan untuk mencari satu atau beberapa data dari sebuah collection dengan menambahkan body(criteria) dan opsi(limit, page)secara spesifik
```js
- example body 1
{} // => mongodb.collection.find({})

- example body 2
{
    username: 'testuser'
} // find data where username = 'testuser'
```

#### [POST] /:model/findOne 
->  digunakan untuk mencari satu data dari suatu collection dengan menambahkan body(criteria) dan opsi(limit, page)secara spesifik
```js
- example body 1
{} // => mongodb.collection.find({})

- example body 2
{
    username: 'testuser'
} // find data where username = 'testuser'
```

#### [POST] /:model/create
->  digunakan untuk menambahkan satu atau lebih data kedalam suatu collection dengan menambahkan body(data[object/array]) secara spesifik
```js
- example 1
{
    username: 'test1',
    fullname: 'nama full test 1',
    ...
} // => insert 1 object data kedalam collection

- example 2
[
    {
        username: 'test1',
        fullname: 'nama full test 1',
        ...
    }, // => insert data 1 object data kedalam collection
    {
        username: 'test2',
        fullname: 'nama full test 2',
        ...
    }, // => insert data 2 object data kedalam collection
    ...
]
```

#### [POST] /:model/updateOne
->  digunakan untuk mengubah nilai satu data dari suatu collection dengan menambahkan body(data[object.criteria & object.update]) secara spesifik
```js
- example body 1
{
    criteria: {
        username: 'test1'
    },
    update: {
        fullname: 'user change 1',
        ...
    }
}
```

#### [POST] /:model/updateMany
->  digunakan untuk mengubah nilai satu/lebih data dari suatu collection dengan menambahkan body(data[object.criteria & object.update]) secara spesifik
```js
```

#### [POST] /:model/deleteOne
->  digunakan untuk menghapus satu data dari suatu collection dengan menambahkan body(data[object.criteria & object.update]) secara spesifik
```js
```

#### [POST] /:model/deleteMany
->  digunakan untuk menghapus satu/lebih data dari suatu collection dengan menambahkan body(data[object.criteria & object.update]) secara spesifik
```js
```

#### [POST] /:model/aggregate
->  digunakan untuk membuat fungsi aggregate dari suatu collection dengan menambahkan body(object) secara spesifik
```js
```