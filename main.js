// Módulos
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert'); //Gestionar ficheros estáticos
const Vision = require('@hapi/vision');
const Cookie = require('@hapi/cookie'); //Autenticación
const routes = require("./routes.js");
const handlebars = require('handlebars');
const repositorio = require("./repositorio.js");
const nodemailer = require("nodemailer");

// Servidor
const server = Hapi.server({
    port: 8090,
    host: 'localhost',
});

handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

// Declarar metodos comunes
server.method({
    name: 'getRepositorio',
    method: () => {
        return repositorio;
    },
    options: {}
});
server.method({
    name: 'getNodemailer',
    method: () => {
        return nodemailer;
    },
    options: {}
});



const iniciarServer = async () => {
    try {
        // Registrar el Inter antes de usar directory en routes
        await server.register(Inert);
        await server.register(Vision);
        await server.register(Cookie);
        await server.register({
            plugin: require('hapi-server-session'),
            options: {
                cookie: {
                    isSecure: false, // never set to false in production
                },
            },
        });

        //Configurar seguridad, podemos tener varias estrategias
        //auth-registrado es el nombre que le damos a la estrategia de autenticación
        await server.auth.strategy('auth-registrado', 'cookie', {
            cookie: {
                name: 'session-id',
                password: 'secretosecretosecretosecretosecretosecretosecreto',
                isSecure: false
            },
            //Página a la que se redirige si se accede a una dirección sin permisos
            redirectTo: '/login',
            //Función asíncrona que comprueba si hay un usuario identificado
            validateFunc: function (request, cookie){
                promise = new Promise((resolve, reject) => {

                    usuarioCriterio = {"usuario": cookie.usuario};
                    //Cookie secreto es una clave secreta que solo sabe mi app, es para saber que la hice yo
                    //Lo mejor es que este secreto cambie en cada iteracion
                    //Y mejor aun es meter la IP
                    if ( cookie.usuario != null && cookie.usuario != "" &&
                        cookie.secreto == "secreto"){

                        resolve({valid: true,
                            credentials: cookie.usuario});

                    } else {
                        resolve({valid: false});
                    }
                });

                return promise;
            }
        });

        await server.register(routes);
        await server.views({
            //Indicar los motores utilizados
            engines: {
                html: require('handlebars')
            },
            relativeTo: __dirname,
            path: './views',
            //Para usar ficheros de la carpeta 'layout'
            layoutPath: './views/layout',
            //Context permite guardar info accesible desde cualquier plantilla
            context : {
                sitioWeb: "periodico"
            }
        });
        await server.start();
        console.log('Servidor localhost:8090');
    } catch (error) {
        console.log('Error '+error);
    }
};

iniciarServer();