module.exports = {
    conexion : async () => {
        var mongo = require("mongodb");
        var db = "mongodb://admin:informatica1234@cluster0-shard-00-00-pse4l.mongodb.net:27017,cluster0-shard-00-01-pse4l.mongodb.net:27017,cluster0-shard-00-02-pse4l.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority";
        promise = new Promise((resolve, reject) => {
            mongo.MongoClient.connect(db, (err, db) => {
                if (err) {
                    resolve(null)
                } else {
                    resolve(db);
                }
            });
        });
        return promise;
    },
    obtenerUsuarios : async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('usuarios');
            collection.find(criterio).toArray( (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // lista de usuarios
                    resolve(result);
                }
                db.close();
            });
        });

        return promise;
    },
    eliminarAnuncios : async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('anuncios');
            collection.remove(criterio, (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(result);
                }
                db.close();
            });
        });

        return promise;
    },
    //"pg" es el indice de la pagina que quieres consultar
    obtenerAnunciosPg : async (db, pg, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('anuncios');
            //Contar el numero de elementos para saber cuantas páginas poner
            //Limit(2) es el número de elementos que queremos que nos de, en este caso 2 por página
            collection.count( criterio, (err, count) => {
                collection.find(criterio).skip( (pg-1)*2 ).limit( 2 )
                    .toArray( (err, result) => {

                        if (err) {
                            resolve(null);
                        } else {
                            // lista de anuncios
                            result.total = count;
                            resolve(result);
                        }
                        db.close();
                    });
            })
        });

        return promise;
    },
    obtenerAnuncios : async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('anuncios');
            collection.find(criterio).toArray( (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // lista de anuncios
                    resolve(result);
                }
                db.close();
            });
        });

        return promise;
    },
    insertarUsuario : async (db, usuario) => {

        promise = new Promise((resolve, reject) => {
            var collection = db.collection('usuarios');
            collection.insert(usuario, (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // _id no es un string es un ObjectID
                    resolve(result.ops[0]._id.toString());
                }
                db.close();
            });
        });

        return promise;
    },
    insertarAnuncio : async (db, anuncio) => {

        promise = new Promise((resolve, reject) => {
            var collection = db.collection('anuncios');
            collection.insert(anuncio, (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // _id no es un string es un ObjectID
                    resolve(result.ops[0]._id.toString());
                }
                db.close();
            });
        });

        return promise;
    },
    modificarAnuncio : async (db, criterio, anuncio) => {

        promise = new Promise((resolve, reject) => {
            var collection = db.collection('anuncios');
            collection.update(criterio, {$set: anuncio}, (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // modificado
                    resolve(result);
                }
                db.close();
            });
        });

        return promise;
    }
}