module.exports = {
    name: 'MiRouter',
    utilSubirFichero : async (binario, nombre, extension) => {
        return new Promise((resolve, reject) => {
            nombre = nombre + "." + extension;
            require('fs').writeFile('./public/subidas/'+nombre, binario, err => {
                if (err) {
                    resolve(false)
                }
                resolve(true)
            })
        })
    },
    register: async (server, options) => {

        repositorio = server.methods.getRepositorio();

        server.route([
            {
                method: 'GET',
                path: '/anuncio/{id}/eliminar',
                handler: async (req, h) => {

                    var criterio = { "_id" :
                            require("mongodb").ObjectID(req.params.id) };

                    await repositorio.conexion()
                        .then((db) => repositorio.eliminarAnuncios(db, criterio))
                        .then((resultado) => {
                            console.log("Eliminado")
                        })

                    return h.redirect('/misnoticias?mensaje="Anuncio Eliminado"')
                }
            },
            {
                method: 'POST',
                path: '/anuncio/{id}/modificar',
                options : {
                    auth: 'auth-registrado',
                    payload: {
                        output: 'stream'
                    }
                },
                handler: async (req, h) => {

                    // criterio de anucio a modificar
                    var criterio = {
                        "_id" : require("mongodb").ObjectID(req.params.id),
                        "usuario": req.auth.credentials
                    }

                    // nuevos valores para los atributos
                    anuncio = {
                        usuario: req.auth.credentials ,
                        titulo: req.payload.titulo,
                        descripcion: req.payload.descripcion,
                        categoria: req.payload.categoria,
                        precio: Number.parseFloat(req.payload.precio),
                    }

                    // await no continuar hasta acabar esto
                    // Da valor a respuesta
                    await repositorio.conexion()
                        .then((db) => repositorio.modificarAnuncio(db,criterio,anuncio))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta =  h.redirect('/misnoticias?mensaje="Error al modificar"')
                            } else {
                                respuesta = h.redirect('/misnoticias?mensaje="Anuncio modificado"')
                            }
                        })

                    // ¿nos han enviado foto nueva?
                    if ( req.payload.foto.filename != "") {
                        binario = req.payload.foto._data;
                        extension = req.payload.foto.hapi.filename.split('.')[1];

                        await module.exports.utilSubirFichero(
                            binario, req.params.id, extension);
                    }

                    return respuesta;
                }
            },
            {
                method: 'GET',
                path: '/anuncio/{id}/modificar',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    var criterio = {
                        "_id" : require("mongodb").ObjectID(req.params.id),
                        //Para comprobar que el usuario que lo intenta modificar es el que esta en sesión
                        //Si no hacemos esto puede ser que alguien adivine la ID y lo intente modificar desde fuera
                        "usuario": req.auth.credentials
                    }
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerAnuncios(db, criterio))
                        .then((anuncios) => {
                            // ¿Solo una coincidencia por _id?
                            anuncio = anuncios[0];
                        })

                    return h.view('modificar',
                        { anuncio: anuncio},
                        { layout: 'base'} );
                }
            },
            {
                method: 'POST',
                path: '/publicar',
                options : {
                    auth: 'auth-registrado',
                    payload: {
                        output: 'stream'
                    }
                },
                handler: async (req, h) => {

                    anuncio = {
                        usuario: req.auth.credentials ,
                        titulo: req.payload.titulo,
                        descripcion: req.payload.descripcion,
                        categoria: req.payload.categoria,
                        precio: Number.parseFloat(req.payload.precio),

                    }

                    // await no continuar hasta acabar esto
                    // Da valor a respuesta

                    await repositorio.conexion()
                        .then((db) => repositorio.insertarAnuncio(db, anuncio))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta =  h.redirect('/misnoticias?mensaje="Error al insertar"')
                            } else {
                                respuesta = h.redirect('/misnoticias?mensaje="Anuncio Insertado"')
                                idAnuncio = id;
                            }
                        })

                    binario = req.payload.foto._data;
                    extension = req.payload.foto.hapi.filename.split('.')[1];

                    await module.exports.utilSubirFichero(
                        binario, idAnuncio, extension);

                    return respuesta;
                }
            },
            {
                method: 'GET',
                path: '/publicar',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    return h.view('publicar',
                        { usuario: 'jordán'},
                        { layout: 'base'});
                }
            },
            {
                method: 'GET',
                path: '/base',
                handler: {
                    view: 'layout/base'
                }
            },
            {
                method: 'GET',
                path: '/registro',
                handler: async (req, h) => {
                    return h.view('registro',
                        { },
                        { layout: 'base'});
                }
            },
            {
                method: 'GET',
                path: '/login',
                handler: async (req, h) => {
                    return h.view('login',
                        { },
                        { layout: 'base'});
                }
            },
            {
                method: 'GET',
                path: '/desconectarse',
                handler: async (req, h) => {
                    req.cookieAuth.set({ usuario: "", secreto: "" });
                    return h.view('login',
                        { },
                        { layout: 'base'});
                }
            },
            {
                method: 'POST',
                path: '/login',
                handler: async (req, h) => {
                    password = require('crypto').createHmac('sha256', 'secreto')
                        .update(req.payload.password).digest('hex');

                    usuarioBuscar = {
                        usuario: req.payload.usuario,
                        password: password
                    }

                    // await no continuar hasta acabar esto
                    // Da valor a respuesta
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerUsuarios(db, usuarioBuscar))
                        .then((usuarios) => {
                            respuesta = "";
                            if (usuarios == null || usuarios.length == 0 ) {
                                respuesta =  h.redirect('/login?mensaje="Usuario o password incorrecto"')
                            } else {
                                req.cookieAuth.set({
                                    usuario: usuarios[0].usuario,
                                    secreto : "secreto"
                                });
                                respuesta = h.redirect('/misnoticias')

                            }
                        })
                    return respuesta;
                }
            },
            {
                method: 'POST',
                path: '/registro',
                handler: async (req, h) => {
                    password = require('crypto').createHmac('sha256', 'secreto')
                        .update(req.payload.password).digest('hex');

                    usuario = {
                        nombre: req.payload.nombre,
                        apellidos: req.payload.apellidos,
                        email: req.payload.email,
                        usuario: req.payload.usuario,
                        password: password
                    }

                    criterio = {
                        usuario: req.payload.usuario
                    }

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerUsuarios(db, criterio))
                        .then((usuarios) => {
                            //Si no hay usuarios con el mismo username, se permite insertar
                            if (usuarios == null || usuarios.length == 0 ) {
                                respuesta = "";
                            } else {
                                respuesta = h.redirect('/registro?mensaje="Error en el registro. El usuario ya existe en la base de datos."')
                            }
                        })

                    if (respuesta == "") {
                        await repositorio.conexion()
                            .then((db) => repositorio.insertarUsuario(db, usuario))
                            .then((id) => {
                                respuesta = "";
                                if (id == null) {
                                    respuesta = h.redirect('/registro?mensaje="Error al crear cuenta"')
                                } else {
                                    respuesta = h.redirect('/login?mensaje="Usuario Creado"')
                                    idAnuncio = id;
                                }
                            })
                    }

                    return respuesta;
                }
            },
            {
                method: 'GET',
                path: '/misnoticias',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    var pg = parseInt(req.query.pg); // Es String !!!
                    if ( req.query.pg == null){ // Puede no venir el param
                        pg = 1;
                    }

                    var criterio = { "usuario" : req.auth.credentials };
                    // cookieAuth

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerAnunciosPg(db, pg, criterio))
                        .then((anuncios, total) => {
                            anunciosEjemplo = anuncios;

                            pgUltima = anunciosEjemplo.total/2;
                            // La página 2.5 no existe
                            // Si excede sumar 1 y quitar los decimales
                            if (pgUltima % 2 > 0 ){
                                pgUltima = Math.trunc(pgUltima);
                                pgUltima = pgUltima+1;
                            }

                        })

                    //Aquí se decide que páginas aparecen en el fondo de la página. En este caso se muestran todas.
                    //Lo ideal es mostrar la primera, la ultima, la actual, la anterior y posterior.
                    var paginas = [];
                    for( i=1; i <= pgUltima; i++){
                        if ( i == pg ){
                            paginas.push({valor: i , clase : "uk-active" });
                        } else {
                            paginas.push({valor: i});
                        }
                    }
                    return h.view('misanuncios',
                        {
                            anuncios: anunciosEjemplo,
                            usuarioAutenticado: req.auth.credentials,
                            paginas : paginas
                        },
                        { layout: 'base'} );
                }
            },
            {
                method: 'GET',
                path: '/noticias',
                handler: async (req, h) => {


                    anunciosEjemplo = [
                        {titulo: "iphone", precio: 400},
                        {titulo: "xBox", precio: 300},
                        {titulo: "teclado", precio: 30},
                    ]

                    var criterio = {};
                    if (req.query.criterio != null ){
                        criterio = { "titulo" : {$regex : ".*"+req.query.criterio+".*"}};
                    }
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerAnuncios(db, criterio))
                        .then((anuncios) => {
                            anunciosEjemplo = anuncios;
                        })

                    // Recorte
                    anunciosEjemplo.forEach( (e) => {
                        if (e.titulo.length > 25){
                            e.titulo =
                                e.titulo.substring(0, 25) + "...";
                        }
                        if (e.descripcion.length > 80) {
                            e.descripcion =
                                e.descripcion.substring(0, 80) + "...";;
                        }
                    });

                    return h.view('anuncios',
                        {
                            usuario: 'jordán',
                            anuncios: anunciosEjemplo
                        }, { layout: 'base'} );
                }
            },
            {
                method: 'GET',
                path: '/{param*}',
                handler: {
                    directory: {
                        path: './public'
                    }
                }
            },
            {
                method: 'GET',
                path: '/anuncio/{id}',
                handler: async  (req, h) => {
                    return 'Anuncio id: ' + req.params.id;
                }
            },
            {
                method: 'GET',
                path: '/',
                handler: async (req, h) => {
                    return h.view('index',
                        { usuario: 'jordán'},
                        { layout: 'base'});
                }
            }
        ])
    }
}