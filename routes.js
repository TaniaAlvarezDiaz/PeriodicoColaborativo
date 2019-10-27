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
                method: 'POST',
                path: '/noticia/{id}/compartir',
                options : {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    noticiaCompartida = {
                        usuario: req.state["session-id"].usuario ,
                        usuarioDestino: req.payload.usuario,
                        idNoticia: require("mongodb").ObjectID(req.params.id),
                    }

                    await repositorio.conexion()
                        .then((db) => repositorio.insertarNoticiaCompartida(db, noticiaCompartida))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta =  h.redirect('/misnoticias?mensaje=Error al compartir.&tipoMensaje=danger')
                            } else {
                                respuesta = h.redirect('/misnoticias?mensaje=Noticia compartida.&tipoMensaje=success')
                            }
                        })

                    return respuesta;
                }
            },
            {
                method: 'GET',
                path: '/noticia/{id}/compartir',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    //Buscar todos los usuarios menos el actual, no se la puede compartir con él mismo
                    var criterio = {
                        "usuario": { $ne: req.state["session-id"].usuario }
                    }
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerUsuarios(db, criterio))
                        .then((usuarios) => {
                            lstUsuarios = usuarios;
                        })

                    //Ordenar la lista de usuarios alfabeticamente
                    lstUsuarios.sort((a, b) => a.usuario.localeCompare(b.usuario));

                    //Buscar la noticia
                    criterio = {
                        "_id" : require("mongodb").ObjectID(req.params.id)
                    }
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerNoticias(db, criterio))
                        .then((noticias) => {
                            noticia = noticias[0];
                        })

                    return h.view('compartirnoticia',
                        {
                            usuarioAutenticado: req.state["session-id"].usuario,
                            usuarios: lstUsuarios,
                            noticia: noticia
                        },
                        { layout: 'base'} );
                }
            },
            {
                method: 'GET',
                path: '/noticiasCompartidas',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    var criterio = { "usuarioDestino" : req.state["session-id"].usuario};

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerNoticiasCompartidas(db, criterio))
                        .then((noticias) => {
                            //Cada objeto tiene el id de la noticia compartida
                            lstNoticias = noticias;
                        })

                    //Obtener los ids de las noticias
                    lstIdsNoticias = []
                    for ( i=0; i<lstNoticias.length; i++)
                        lstIdsNoticias[i] = lstNoticias[i].idNoticia;

                    //Buscar los ids de las noticias compartidas en la colección noticias para obtener el resto de valores de la noticia
                    criterio = { "_id" : {$in: lstIdsNoticias}};
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerNoticias(db, criterio))
                        .then((noticiasCompartidas) => {
                            lstNoticias = noticiasCompartidas;
                        })

                    // Recorte
                    lstNoticias.forEach( (e) => {

                        //Indicar a la noticia que hay usuario autenticado
                        e.usuarioAutenticado = req.state["session-id"].usuario;

                        if (e.usuario == req.state["session-id"].usuario) {
                            e.adminNoticia = true;
                        }

                        if (e.titulo.length > 35){
                            e.titulo =
                                e.titulo.substring(0, 35) + "...";
                        }
                        if (e.subtitulo.length > 80) {
                            e.descripcion =
                                e.descripcion.substring(0, 80) + "...";;
                        }
                    });

                    if(lstNoticias.length != 0) {
                        return h.view('noticiascompartidas',
                            {
                                usuarioAutenticado: req.state["session-id"].usuario,
                                noticias: lstNoticias,
                                numero: lstNoticias.length
                            }, {layout: 'base'});
                    }
                    return h.view('noticiascompartidas',
                        {
                            usuarioAutenticado: req.state["session-id"].usuario,
                            noticias: lstNoticias
                        }, { layout: 'base'} );

                }
            },
            {
                method: 'GET',
                path: '/misdatos',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    var criterio = { "usuario" : req.state["session-id"].usuario };

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerUsuarios(db, criterio))
                        .then((usuarios) => {
                           usuario = usuarios[0]; //Devuelve el usuario en sesión
                        })

                    return h.view('misdatos',
                        {
                            usuario: usuario,
                            usuarioAutenticado: req.state["session-id"].usuario
                        },
                        { layout: 'base'} );
                }
            },
            {
                method: 'GET',
                path: '/eliminar/{id}/noticia',
                handler: async (req, h) => {

                    var criterio = { "_id" :
                            require("mongodb").ObjectID(req.params.id) };

                    var criterioComentario = { "noticia" : req.params.id };

                    var criterioCompartido = { "idNoticia": require("mongodb").ObjectID(req.params.id) };

                    await repositorio.conexion()
                        .then((db) => repositorio.eliminarComentario(db, criterioComentario))
                        .then((resultado) => {
                            if (resultado == null) {
                                return h.redirect('/noticias' + '?mensaje=Error al eliminar la noticia.&tipoMensaje=danger')
                            }
                        })

                    await repositorio.conexion()
                        .then((db) => repositorio.eliminarNoticiaCompartida(db, criterioCompartido))
                        .then((resultado) => {
                            if (resultado == null) {
                                return h.redirect('/noticias' + '?mensaje=Error al eliminar la noticia.&tipoMensaje=danger')
                            }
                        })

                    await repositorio.conexion()
                        .then((db) => repositorio.eliminarNoticia(db, criterio))
                        .then((resultado) => {
                            if (resultado == null) {
                                return h.redirect('/noticias' + '?mensaje=Error al eliminar la noticia.&tipoMensaje=danger')
                            }
                        })

                    return h.redirect('/noticias' + '?mensaje=Noticia eliminada correctamente.&tipoMensaje=success')
                }
            },
            {
                method: 'GET',
                path: '/eliminar/{id}/comentario/{noticia}',
                handler: async (req, h) => {

                    var criterio = {"_id" : require("mongodb").ObjectID(req.params.id) };

                    await repositorio.conexion()
                        .then((db) => repositorio.eliminarComentario(db, criterio))
                        .then((resultado) => {
                            respuesta = "";
                            if (resultado == null) {
                                respuesta =  h.redirect('/detalle/'+ req.params.noticia + '?mensaje=Error al eliminar el comentario.&tipoMensaje=danger');
                            } else {
                                respuesta =  h.redirect('/detalle/'+ req.params.noticia + '?mensaje=Comentario eliminado correctamente.&tipoMensaje=sucess');
                            }
                        })

                    return respuesta;
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

                    var criterio = {
                        "_id" : require("mongodb").ObjectID(req.params.id),
                        "usuario": req.state["session-id"].usuario
                    }

                    noticia = {
                        usuario: req.auth.credentials,
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
                            if (id == null) {
                                respuesta =  h.redirect('/noticias?mensaje=Error al modificar la noticia.&tipoMensaje=danger')
                            } else {
                                respuesta = h.redirect('/noticias?mensaje=Noticia modificada correctamente.&tipoMensaje=success')
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
                        {
                            noticia: noticia,
                            usuarioAutenticado: req.state["session-id"].usuario
                        },
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
                                respuesta =  h.redirect('/misnoticias?mensaje=Error al publicar.&tipoMensaje=danger')
                            } else {
                                respuesta = h.redirect('/misnoticias?mensaje=Noticia publicada.&tipoMensaje=success')
                                idNoticia = id;
                            }
                        })

                    binario = req.payload.foto._data;
                    extension = req.payload.foto.hapi.filename.split('.')[1];

                    await module.exports.utilSubirFichero(binario, idNoticia, extension);

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
                        {
                            usuarioAutenticado: req.state["session-id"].usuario
                        },
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
                                respuesta =  h.redirect('/login?mensaje=Usuario o password incorrecto.&tipoMensaje=danger')
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
                                respuesta = h.redirect('/registro?mensaje=Error en el registro. El usuario ya existe en la base de datos.&tipoMensaje=danger')
                            }
                        })

                    if (respuesta == "") {
                        await repositorio.conexion()
                            .then((db) => repositorio.insertarUsuario(db, usuario))
                            .then((id) => {
                                respuesta = "";
                                if (id == null) {
                                    respuesta = h.redirect('/registro?mensaje=Error al crear cuenta.&tipoMensaje=danger')
                                } else {
                                    respuesta = h.redirect('/login?mensaje=Usuario creado.&tipoMensaje=success')
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

                    var criterio = { "usuario" : req.state["session-id"].usuario };
                    // cookieAuth

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerNoticiasPg(db, pg, criterio))
                        .then((noticias, total) => {
                            noticiasEjemplo = noticias;

                            pgUltima = noticiasEjemplo.total/5;
                            // Si excede sumar 1 y quitar los decimales
                            if (pgUltima % 5 > 0 ){
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
                            usuarioAutenticado: req.state["session-id"].usuario,
                            paginas : paginas
                        },
                        { layout: 'base'} );
                }
            },
            {
                method: 'GET',
                path: '/noticias',
                handler: async (req, h) => {

                    var criterio = {};

                    if(req.query.categoria != undefined) {
                        criterio = {
                            "categoria" : {$regex : ".*"+req.query.categoria+".*"}
                        };
                    }

                    if(req.query.titulo != undefined ||  req.query.usuario != undefined){
                        criterio = {
                            "titulo" : {$regex : ".*"+req.query.titulo +".*"},
                            "usuario" : {$regex : ".*"+req.query.usuario +".*"}
                        };
                    }

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerNoticias(db, criterio))
                        .then((noticias) => {
                            noticiasEjemplo = noticias;
                        })


                    // Recorte
                    noticiasEjemplo.forEach( (e) => {
                        if (req.state["session-id"] != undefined) {

                            //Indicar a la noticia que hay usuario autenticado
                            e.usuarioAutenticado = req.state["session-id"].usuario;

                            if (e.usuario == req.state["session-id"].usuario) {
                                e.adminNoticia = true;
                            }
                        }
                        if (e.titulo.length > 35){
                            e.titulo =
                                e.titulo.substring(0, 35) + "...";
                        }
                        if (e.subtitulo.length > 80) {
                            e.descripcion =
                                e.descripcion.substring(0, 80) + "...";
                        }
                    });

                    if(noticiasEjemplo.length != 0){
                        if (req.state["session-id"] != undefined) {
                            return h.view('noticias',
                                {
                                    usuarioAutenticado: req.state["session-id"].usuario,
                                    noticias: noticiasEjemplo,
                                    numero: noticiasEjemplo.length
                                }, { layout: 'base'} );
                        }else {
                            return h.view('noticias',
                                {
                                    noticias: noticiasEjemplo,
                                    numero: noticiasEjemplo.length
                                }, { layout: 'base'} );
                        }
                    }
                    if (req.state["session-id"] != undefined) {
                        return h.view('noticias',
                            {
                                usuarioAutenticado: req.state["session-id"].usuario,
                                noticias: noticiasEjemplo
                            }, { layout: 'base'} );
                    }else {
                        return h.view('noticias',
                            {
                                noticias: noticiasEjemplo
                            }, { layout: 'base'} );
                    }
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
                        {comentario: "Comentario acerca de ...", usuario: "Pepe", valoracion: 5, noticia: "89rtgerjg54ierñwolj"},
                        {comentario: "Comentario sobre el deporte ...", usuario: "Juan", valoracion: 8, noticia: "89rtgerjg54ierñwolj"},
                        {comentario: "Comentario acerca de ...", usuario: "Julia", valoracion: 9, noticia: "89rtgerjg54ierñwolj"},
                    ]

                    var criterioComentario = {"noticia" : req.params.id}

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

                    var  criterio = {"_id" : require("mongodb").ObjectID(req.params.id)}

                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerNoticias(db, criterio))
                        .then((noticias) => {
                            noticiaEjemplo = noticias[0];
                        })

                    comentariosEjemplo.forEach((e) => {
                        if(req.state["session-id"] != undefined) {
                            if (e.usuario == req.state["session-id"].usuario ||
                                noticiaEjemplo.usuario == req.state["session-id"].usuario) {
                                e.borrar = true;
                            }
                        }
                    });

                    if(req.state["session-id"] != undefined) {
                        return h.view('detalle',
                            {
                                usuarioAutenticado: req.state["session-id"].usuario,
                                noticia: noticiaEjemplo,
                                noticiaId: require("mongodb").ObjectID(req.params.id),
                                comentarios: comentariosEjemplo,
                                numeroComentarios: comentariosEjemplo.length,
                            }, { layout: 'base'});
                    }else {
                        return h.view('detalle',
                            {
                                noticia: noticiaEjemplo,
                                noticiaId: require("mongodb").ObjectID(req.params.id),
                                comentarios: comentariosEjemplo,
                                numeroComentarios: comentariosEjemplo.length,
                            }, { layout: 'base'});
                    }

                }
            },
            {
                method: 'GET',
                path: '/',
                handler: async (req, h) => {
                    return h.redirect('/noticias');
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
                                respuesta =  h.redirect('/detalle/'+ idNot + '?mensaje=Error al añadir el comentario.&tipoMensaje=danger')
                            } else {
                                respuesta = h.redirect('/detalle/' + idNot + '?mensaje=Comentario añadido correctamente.&tipoMensaje=success')
                                idNoticia = id;
                            }
                        })
                    return respuesta;
                }
            },
        ])
    }
}