module.exports = {
    conexion : async () => {
        var mongo = require("mongodb");
        var db = "mongodb://admin:adminadmin@cluster0-shard-00-00-icwvv.mongodb.net:27017,cluster0-shard-00-01-icwvv.mongodb.net:27017,cluster0-shard-00-02-icwvv.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority";
        //var db = "mongodb://admin:informatica1234@cluster0-shard-00-00-pse4l.mongodb.net:27017,cluster0-shard-00-01-pse4l.mongodb.net:27017,cluster0-shard-00-02-pse4l.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority";
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
    insertarNoticiaCompartida : async (db, noticiaCompartida) => {

        promise = new Promise((resolve, reject) => {
            var collection = db.collection('noticiasCompartidas');
            collection.insert(noticiaCompartida, (err, result) => {
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
    obtenerNoticiasCompartidas : async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('noticiasCompartidas');
            collection.find(criterio).toArray( (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // lista de noticias
                    resolve(result);
                }
                db.close();
            });
            db.close();
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
    eliminarComentario : async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('comentarios');
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
    obtenerNoticiasPg : async (db, pg, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('noticias');
            //Contar el numero de elementos para saber cuantas páginas poner
            //Limit es el número de elementos que queremos que nos de, en este caso 2 por página
            collection.count( criterio, (err, count) => {
                collection.find(criterio).skip( (pg-1)*5 ).limit( 5 )
                    .toArray( (err, result) => {
                        if (err) {
                            resolve(null);
                        } else {
                            // lista de noticias
                            result.total = count;
                            resolve(result);
                        }
                        db.close();
                    });
            })
        });

        return promise;
    },
    obtenerNoticias : async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('noticias');
            collection.find(criterio).toArray( (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // lista de noticias
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
    insertarNoticia : async (db, noticia) => {

        promise = new Promise((resolve, reject) => {
            var collection = db.collection('noticias');
            collection.insert(noticia, (err, result) => {
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
    insertarComentario : async (db, comentario) => {

        promise = new Promise((resolve, reject) => {
            var collection = db.collection('comentarios');
            collection.insert(comentario, (err, result) => {
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
    obtenerComentarios : async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('comentarios');
            collection.find(criterio).toArray( (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // lista de comemtarios
                    resolve(result);
                }
                db.close();
            });
        });
        return promise;
    },
    modificarNoticia : async (db, criterio, noticia) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('noticias');
            collection.update(criterio, {$set: noticia}, (err, result) => {
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
    },
    eliminarNoticia : async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('noticias');
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
    eliminarNoticiaCompartida : async (db, criterio) => {
        promise = new Promise((resolve, reject) => {
            var collection = db.collection('noticiasCompartidas');
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
    }
}