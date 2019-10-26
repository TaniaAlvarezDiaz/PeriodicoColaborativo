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
                path: '/eliminar/{id}/comentario/{noticia}',
                handler: async (req, h) => {

                    var criterio = { "_id" :
                            require("mongodb").ObjectID(req.params.id) };

                    await repositorio.conexion()
                        .then((db) => repositorio.eliminarComentario(db, criterio))
                        .then((resultado) => {
                            console.log("Comentario eliminado")
                        })
                    console.log(req.params.id)
                    console.log(req.params.noticia)
                    return h.redirect('/detalle/'+ req.params.noticia + '?mensaje="Comentario Eliminado Correctamente"')
                }
            },
            {
                method: 'POST',
                path: '/noticia/{id}/modificar',
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
                        "usuario": req.state["session-id"].usuario
                    }

                    // nuevos valores para los atributos
                    noticia = {
                        usuario: req.auth.credentials ,
                        titulo: req.payload.titulo,
                        subtitulo: req.payload.subtitulo,
                        categoria: req.payload.categoria,
                        fecha: req.payload.fecha,
                        cuerpo: req.payload.cuerpo
                    }

                    // await no continuar hasta acabar esto
                    // Da valor a respuesta
                    await repositorio.conexion()
                        .then((db) => repositorio.modificarNoticia(db,criterio,noticia))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta =  h.redirect('/noticias?mensaje="Error al modificar la noticia"')
                            } else {
                                respuesta = h.redirect('/noticias?mensaje="Noticia modificada correctamente"')
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
                path: '/noticia/{id}/modificar',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    var criterio = {
                        "_id" : require("mongodb").ObjectID(req.params.id),
                        //Para comprobar que el usuario que lo intenta modificar es el que esta en sesión
                        //Si no hacemos esto puede ser que alguien adivine la ID y lo intente modificar desde fuera
                        "usuario": req.state["session-id"].usuario
                    }
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerNoticias(db, criterio))
                        .then((noticias) => {
                            // ¿Solo una coincidencia por _id?
                            noticia = noticias[0];
                        })

                    return h.view('modificar',
                        { noticia: noticia},
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

                    noticia = {
                        usuario: req.auth.credentials ,
                        titulo: req.payload.titulo,
                        subtitulo: req.payload.subtitulo,
                        categoria: req.payload.categoria,
                        fecha: req.payload.fecha,
                        cuerpo: req.payload.cuerpo
                    }

                    // await no continuar hasta acabar esto
                    // Da valor a respuesta

                    await repositorio.conexion()
                        .then((db) => repositorio.insertarNoticia(db, noticia))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta =  h.redirect('/misnoticias?mensaje="Error al insertar"')
                            } else {
                                respuesta = h.redirect('/misnoticias?mensaje="Noticia Insertada"')
                                idNoticia = id;
                            }
                        })

                    binario = req.payload.foto._data;
                    extension = req.payload.foto.hapi.filename.split('.')[1];

                    await module.exports.utilSubirFichero(
                        binario, idNoticia, extension);

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
                //////PRUEBA
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
                        .then((db) => repositorio.obtenerNoticiasPg(db, pg, criterio))
                        .then((noticias, total) => {
                            noticiasEjemplo = noticias;

                            pgUltima = noticiasEjemplo.total/2;
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
                    return h.view('misnoticias',
                        {
                            noticias: noticiasEjemplo,
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


                    noticiasEjemplo = [
                        {titulo: "iphone", precio: 400},
                        {titulo: "xBox", precio: 300},
                        {titulo: "teclado", precio: 30},
                    ]

                    var criterio = {};
                    if (req.query.criterio != null ){
                        criterio = { "titulo" : {$regex : ".*"+req.query.criterio+".*"}};
                    }
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerNoticias(db, criterio))
                        .then((noticias) => {
                            noticiasEjemplo = noticias;
                        })


                    // Recorte
                    noticiasEjemplo.forEach( (e) => {
                        if (e.usuario == req.state["session-id"].usuario) {
                            e.adminNoticia = true;
                        }
                        if (e.titulo.length > 25){
                            e.titulo =
                                e.titulo.substring(0, 25) + "...";
                        }
                        if (e.subtitulo.length > 80) {
                            e.descripcion =
                                e.descripcion.substring(0, 80) + "...";;
                        }
                    });

                    return h.view('noticias',
                        {
                            usuario: 'jordán',
                            noticias: noticiasEjemplo
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
                path: '/detalle/{id}',
                handler: async  (req, h) => {
                    comentariosEjemplo = [
                        {comentario: "Comentario a cerca de ...", usuario: "Pepe", valoracion: 5, noticia: "89rtgerjg54ierñwolj"},
                        {comentario: "Comentario sobre el deporte ...", usuario: "Juan", valoracion: 8, noticia: "89rtgerjg54ierñwolj"},
                        {comentario: "Comentario a cerca de ...", usuario: "Julia", valoracion: 9, noticia: "89rtgerjg54ierñwolj"},
                    ]

                    var criterioComentario = {
                        "noticia" : req.params.id
                    }
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerComentarios(db, criterioComentario))
                        .then((comentarios) => {
                            comentariosEjemplo = comentarios;
                        })

                    noticiaEjemplo = {
                        titulo: "titulo",
                        subtitulo: "subtitulo",
                        usuario: "usuario",
                        categoria: "categoria",
                        fecha: "fecha",
                        cuerpo: "cuerpo"
                    }
                    var  criterio = {
                        "_id" : require("mongodb").ObjectID(req.params.id)
                    }
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerNoticias(db, criterio))
                        .then((noticias) => {
                            noticiaEjemplo = noticias[0];
                        })

                    comentariosEjemplo.forEach( (e) => {
                        if (e.usuario == req.state["session-id"].usuario ||
                            noticiaEjemplo.usuario == req.state["session-id"].usuario){
                            e.borrar = true;
                        }
                    });

                    return h.view('detalle',
                        {
                            usuario: 'jordán',
                            noticia: noticiaEjemplo,
                            comentarios: comentariosEjemplo,
                            numeroComentarios: comentariosEjemplo.length,
                        }, { layout: 'base'} );
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
            },
            {
                method: 'POST',
                path: '/publicarComentario',
                options : {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    idNot = req.payload.idNoticia
                    comentario = {
                        usuario: req.auth.credentials ,
                        valoracion: req.payload.valoracion,
                        comentario: req.payload.comentario,
                        noticia: idNot
                    }

                    await repositorio.conexion()
                        .then((db) => repositorio.insertarComentario(db, comentario))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta =  h.redirect('/detalle/'+ idNot + '?mensaje="Error al añadir el comentario"')
                            } else {
                                respuesta = h.redirect('/detalle/' + idNot + '?mensaje="Comentario añadido correctamente"')
                                idNoticia = id;
                            }
                        })
                    return respuesta;
                }
            },
        ])
    }
}