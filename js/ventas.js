/***
 *     __ __    ___  ____   ______   ____  _____
 *    |  T  |  /  _]|    \ |      T /    T/ ___/
 *    |  |  | /  [_ |  _  Y|      |Y  o  (   \_
 *    |  |  |Y    _]|  |  |l_j  l_j|     |\__  T
 *    l  :  !|   [_ |  |  |  |  |  |  _  |/  \ |
 *     \   / |     T|  |  |  |  |  |  |  |\    |
 *      \_/  l_____jl__j__j  l__j  l__j__j \___j
 *
 */
var productos_vender = [],
    ayudante_posicion = 0,
    puede_salir = true,
    total = 0,
    intervalo_ayudante_nprogress,
    TECLA_F1 = 112,
    TECLA_F2 = 113,
    TECLA_F3 = 114,
    TECLA_ENTER = 13,
    TECLA_MENOS = 109,
    EL_CLIENTE_USA_TICKET = true;

window.onbeforeunload = function () {
    if (puede_salir == false || productos_vender.length > 0) return "Todavía no has completado la venta.";
};

$(document)
    .ready(function () {
        principal();
    })
    .ajaxStart(function () {
        NProgress.start();
        intervalo_ayudante_nprogress = setInterval(function () {
            NProgress.inc();
        }, 1000);
    })
    .ajaxStop(function () {
        clearInterval(intervalo_ayudante_nprogress);
        NProgress.done();
    });


function Producto(rowid, codigo, nombre, cantidad, precio, posicion, familia, precio_compra, existencia) {
    this.rowid = rowid;
    this.codigo = codigo;
    this.nombre = nombre;
    this.cantidad = cantidad;
    this.precio_venta = parseFloat(precio);
    this.posicion = posicion;
    this.total = this.cantidad * this.precio_venta;
    this.familia = familia;
    this.precio_compra = parseFloat(precio_compra);
    this.utilidad = (this.precio_venta - this.precio_compra >= 0 ? this.precio_venta - this.precio_compra : 0);
    this.existencia = existencia;
};


Producto.prototype.aumentaCantidad = function () {
    this.cantidad += 1;
    this.refrescaTotal();
};


Producto.prototype.setCantidad = function (cantidad) {
    this.cantidad = parseFloat(cantidad);
    this.refrescaTotal();
};

Producto.prototype.refrescaTotal = function () {
    this.total = this.cantidad * this.precio_venta;
};


function isInt(n) {
    return n % 1 === 0;
}


function principal() {
    autocompletado_input();
    escuchar_elementos();
    $("#codigo_producto").focus();
    dibujar_productos();
    $("li#elem_ventas").addClass("active");
}


function dame_posicion_producto(posicion) {
    for (var x = 0; x < productos_vender.length; x++) {
        if (productos_vender[x].posicion === posicion) return x;
    }
    return -1;
}


function quita_producto_local(posicion) {
    var indice = dame_posicion_producto(posicion);
    if (indice !== -1) {
        productos_vender.splice(indice, 1);
        dibujar_productos();
        $("#codigo_producto").focus();
    }
}
function dame_total_productos_locales() {
    var numero_total = 0;
    for (var i = productos_vender.length - 1; i >= 0; i--) {
        numero_total += productos_vender[i].cantidad;
    }
    return numero_total;
}

/*
productos_vender[2] = {
    cantidad: 1, 
    codigo: "77", 
    existencia: "3.00", 
    familia: "SIN", 
    nombre: "pan", 
    posicion: 3, 
    precio_compra: 1000, 
    precio_venta: 45000, 
    rowid: 4, 
    total: 3000, 
    utilidad: 500}
*/ 
function agrega_producto_local(producto) {
    var ya_esta_en_la_lista = producto_ya_esta_en_lista(producto.codigo);
    if (ya_esta_en_la_lista !== true) {
        var _producto = new
            Producto(
                producto.rowid,
                producto.codigo,
                producto.nombre,
                1,
                producto.precio_venta,
                ayudante_posicion,
                producto.familia,
                producto.precio_compra,
                producto.existencia,
            );
        productos_vender.push(_producto);
        ayudante_posicion++;
    }
    dibujar_productos();
}

// Agregar producto manual
$('#realizar_carga_manual').on('submit', function(event)
{
    event.preventDefault();
    var nombre_producto = $('#nombre_producto').val();
    var precio_producto = $('#precio_producto').val();

    $('#nombre_producto').focus().parent().removeClass('has-error');
    $('#precio_producto').focus().parent().removeClass('has-error');

    if(nombre_producto.length > 0 && precio_producto.length > 0)
    {
        var _producto = new
        Producto(
            0,
            0,
            nombre_producto,
            1,
            precio_producto,
            ayudante_posicion,
            'MANUAL',
            precio_producto,
            99,
        );
        productos_vender.push(_producto);
        ayudante_posicion++;

        $('#nombre_producto').val("");
        $('#precio_producto').val("");
        $("#modal_agregar_manual").modal("hide");

        dibujar_productos();
    }
    else
    {
        if(nombre_producto.length < 1)
        {
            $('#nombre_producto').focus().animateCss("shake");
            $('#nombre_producto').focus().parent().addClass('has-error');
        }

        if(precio_producto.length < 1)
        {
            $('#precio_producto').focus().animateCss("shake");
            $('#precio_producto').focus().parent().addClass('has-error');
        }
    }
    
});
// 

function producto_ya_esta_en_lista(codigo) {
    for (var x = 0; x < productos_vender.length; x++) {
        if (productos_vender[x].codigo === codigo) {
            productos_vender[x].aumentaCantidad();
            return true;
        }
    }
    return false;
}


function quitar_ultimo_producto() {
    $("#codigo_producto").val("");
    if (productos_vender.length > 0) {
        productos_vender.splice(-1, 1);
        dibujar_productos();
    }
    $("#codigo_producto").focus();
    --ayudante_posicion;
}

function dibujar_productos() {
    if (productos_vender.length <= 0) {
        $("#contenedor_tabla")
            .empty()
            .html(
                $("<h2>")
                    .addClass('text-center')
                    .html('Aquí aparecerán los productos que agregues<br><i class = "fa fa-4x fa-cart-plus"></i>')
            );
        $("#contenedor_total").parent().hide();
        return;
    }

    $("#contenedor_tabla")
        .empty()
        .append(
            $("<table>")
                .addClass('table table-striped table-hover table-condensed')
                .append(
                    $("<thead>")
                        .append(
                            $("<tr>")
                                .append(
                                    $("<th>")
                                        .html('Código'),

                                    $("<th>")
                                        .html('Producto'),

                                    $("<th>")
                                        .html('Precio'),

                                    $("<th>")
                                        .html('Cantidad'),

                                    $("<th>")
                                        .html('Total'),

                                    $("<th>")
                                        .html('Quitar')
                                )
                        )
                )
                .append(
                    $("<tbody>")
                )
        );
    var ayudante_total = 0;
    for (var i = productos_vender.length - 1; i >= 0; i--) {
        ayudante_total += productos_vender[i].total;
        let parrafo = $("<p></p>");
        if (productos_vender[i].cantidad > productos_vender[i].existencia) {
            parrafo = $(`<p style="color:#dc2626;"><strong>Aviso: </strong> se está vendiendo más allá de la existencia (existen ${parseFloat(productos_vender[i].existencia).toFixed(2)} y se va a vender ${parseFloat(productos_vender[i].cantidad).toFixed(2)})</p>`);
        }
        $("#contenedor_tabla tbody")
            .append(
                $("<tr>")
                    .append(
                        $("<td>")
                            .html(productos_vender[i].codigo),

                        $("<td>")
                            .html(productos_vender[i].nombre),

                        $("<td>")
                            .html("$" + productos_vender[i].precio_venta),

                        $("<td>")
                            .html(
                                $("<div>")
                                    .addClass('form-group')
                                    .html(
                                        $("<input>")
                                            .attr("placeholder", "Cantidad")
                                            .attr("type", "number")
                                            .attr("data-pos", productos_vender[i].posicion)
                                            .addClass('form-control modificar-cantidad')
                                            .val(productos_vender[i].cantidad)
                                    )
                                    .append(
                                        parrafo
                                    )
                            ),

                        $("<td>")
                            .html("$" + Math.round(productos_vender[i].total * 100) / 100),

                        $("<td>")
                            .html(
                                $("<button>")
                                    .addClass('btn btn-danger quitar-producto')
                                    .attr("data-pos", productos_vender[i].posicion)
                                    .html(
                                        $("<i>")
                                            .addClass('fa fa-trash')
                                    )
                            )
                    )
            );
    }
    ayudante_total = Math.round(ayudante_total * 100) / 100;
    $("#contenedor_total").text("$" + ayudante_total).parent().show();
    total = ayudante_total;
}


function preparar_para_realizar_venta() {
    if (productos_vender.length > 0) {
        $("#modal_procesar_venta").modal("show");
        $("#contenedor_total_modal").text("$" + total).parent().show();
    }
}
function deshabilita_para_venta() {
    $("input, button").prop("disabled", true);
    puede_salir = false;
}
function habilita_para_venta() {
    $("input, button").prop("disabled", false);
    puede_salir = true;
}
async function imprimirTicketUsandoPlugin(productos, total, cambio, ticket, idVenta) {
    if (!ticket) {
        return;
    }
    const serial = "";
    let response = await fetch("./modulos/dame_datos_empresa.php")
    const datosEmpresa = await response.json();
    response = await fetch("./modulos/dame_logotipo.php")
    const logotipo = await response.text();
    response = await fetch("./modulos/dame_impresora.php")
    const nombreImpresora = await response.json();
    const operaciones = [
        { nombre: "Iniciar", argumentos: [], },
        { nombre: "EstablecerAlineacion", argumentos: [1], },
        { nombre: "ImprimirImagenEnBase64", argumentos: [logotipo, 0, 384], },
        { nombre: "Feed", argumentos: [1], },
        { nombre: "Iniciar", argumentos: [], },
        { nombre: "EstablecerAlineacion", argumentos: [1], },
        { nombre: "Feed", argumentos: [2], }
    ];
    for (const dato of datosEmpresa) {
        operaciones.push(
            { nombre: "EscribirTexto", argumentos: [dato], }
        );
    }
    operaciones.push(
        { nombre: "EstablecerEnfatizado", argumentos: [true] },
        { nombre: "EscribirTexto", argumentos: [`Venta #${idVenta}`] },
        { nombre: "EstablecerEnfatizado", argumentos: [false] },
        { nombre: "Feed", argumentos: [1] },
        { nombre: "EstablecerAlineacion", argumentos: [0], },
    );
    const formateador = new Intl.NumberFormat("es-MX", { style: "currency", "currency": "MXN" });
    for (const producto of productos) {
        const importe = producto.cantidad * producto.precio_venta;
        const formateado = formateador.format(importe);

        operaciones.push(
            { nombre: "EstablecerAlineacion", argumentos: [0] },
            { nombre: "EscribirTexto", argumentos: [`${producto.cantidad}x${producto.nombre}\n`] },
            { nombre: "EstablecerAlineacion", argumentos: [2] },
            { nombre: "EscribirTexto", argumentos: [formateado + "\n"] },
        );
    }
    let mensaje = "";
    const hora = new Date().getHours();
    if (hora >= 6 && hora <= 12) {
        mensaje = "le deseamos un buen dia";
    }
    if (hora >= 12 && hora <= 19) {
        mensaje = "le deseamos una buena tarde";
    }
    if (hora >= 19 && hora <= 24) {
        mensaje = "le deseamos una buena noche";
    }
    if (hora >= 0 && hora <= 6) {
        mensaje = "le deseamos un buen dia";
    }
    mensaje = mensaje.toUpperCase();
    operaciones.push(
        { nombre: "EstablecerEnfatizado", argumentos: [true] },
        { nombre: "EscribirTexto", argumentos: [`--------\n`] },
        { nombre: "EscribirTexto", argumentos: [`SU PAGO ${formateador.format(total + cambio)}\n`] },
        { nombre: "EscribirTexto", argumentos: [`TOTAL ${formateador.format(total)}\n`] },
        { nombre: "EscribirTexto", argumentos: [`CAMBIO ${formateador.format(cambio)}\n`] },
        { nombre: "Feed", argumentos: [1] },
        { nombre: "EstablecerAlineacion", argumentos: [1] },
        { nombre: "EstablecerEnfatizado", argumentos: [false] },
        { nombre: "EscribirTexto", argumentos: [mensaje] },
        { nombre: "Feed", argumentos: [2] },
        { nombre: "CorteParcial", argumentos: [] },
        { nombre: "Pulso", argumentos: [48, 60, 120] },
    );
    const payload = {
        nombreImpresora,
        serial,
        operaciones
    };
    response = await fetch("http://localhost:8000/imprimir", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    const correctoAlImprimir = await response.json();
    if (!correctoAlImprimir) {
        alert("Error imprimiendo: " + correctoAlImprimir);
    }
}
function realizar_venta(productos, total, cambio, ticket) {
    cambio = parseFloat(cambio);
    if (cambio < 0) cambio = 0;
    deshabilita_para_venta();
    $("#realizar_venta")
        .html(
            $("<i>")
                .addClass('fa fa-spin fa-spinner')
        )
        .append(" Cargando...")
        .removeClass('btn-warning btn-info')
        .addClass('btn-warning');
    productos = JSON.stringify(productos);
    ticket = JSON.stringify(ticket);
    var numero_productos = dame_total_productos_locales();
    if (!EL_CLIENTE_USA_TICKET) ticket = false;
    $.post('./modulos/ventas/realizar_venta.php', {
        "productos": productos,
        "total": total,
        "ticket": ticket,
        "cambio": cambio
    }, function (respuesta) {
        habilita_para_venta();
        ayudante_posicion = 0;
        respuesta = JSON.parse(respuesta);
        if (respuesta) {
            imprimirTicketUsandoPlugin(JSON.parse(productos), total, cambio, JSON.parse(ticket), respuesta)
            $("#realizar_venta")
                .html(
                    $("<i>")
                        .addClass('fa fa-check-square')
                )
                .append(" ¡Venta correcta!")
                .removeClass('btn-warning btn-info')
                .addClass('btn-info');
            $("#modal_procesar_venta").modal("hide");
            cancelar_venta();
            $("#codigo_producto").focus();
            $("#pago_usuario").val("");
            $("#contenedor_cambio").parent().hide();
        } else {
            console.log("Error, la respuesta es:", respuesta);
        }
    });
}


function cancelar_venta() {
    if (productos_vender.length > 0) {
        productos_vender.length = 0;
        dibujar_productos();
        ayudante_posicion = 0;
    }
    $("#codigo_producto").focus();
    puede_salir = true;
}


function escuchar_elementos() {
    $("#imprimir_ticket").click(function () {
        $("#pago_usuario").focus();
    });

    $(window).resize(function (event) {
        $("#codigo_producto").css("width", $(".btn-group.btn-group-justified").width());
    });
    $("#quitar_ultimo_producto").click(function () {
        quitar_ultimo_producto();
    });
    // Preparar para realizar la venta
    $("#preparar_venta").click(function () {
        preparar_para_realizar_venta();
    });
    // Agregar producto manual
    $("#agregar_producto_manual").click(function() {
        $("#modal_agregar_manual").modal("show");
    });
    $("#cancelar_toda_la_venta").click(function () {
        cancelar_venta();
    });
    $("#pago_usuario").keyup(function (evento) {
        $(this).parent().removeClass('has-error');
        var pago = $(this).val(),
            cambio = pago - total;
        if (cambio >= 0 && !isNaN(pago)) {
            $("#contenedor_cambio").text("$" + cambio).parent().show();
        } else {
            $("#contenedor_cambio").parent().hide();
        }
        if (evento.keyCode === 13) {
            if (cambio >= 0 && !isNaN(pago)) {
                realizar_venta(productos_vender, total, cambio, $("#imprimir_ticket").prop("checked"));
            } else {
                $(this).animateCss("shake");
                $(this).parent().addClass('has-error');
            }
        }
    });

    $("#realizar_venta").click(function () {
        var pago = $("#pago_usuario").val(),
            cambio = pago - total;
        if (cambio >= 0 && !isNaN(pago)) {
            realizar_venta(productos_vender, total, cambio, $("#imprimir_ticket").prop("checked"));
        } else {
            $("#pago_usuario").animateCss("shake");
            $("#pago_usuario").parent().addClass('has-error');
        }
    });


    $("#modal_procesar_venta").on("shown.bs.modal", function () {
        $("#pago_usuario").focus();
    });
    $("#modal_procesar_venta").on("hidden.bs.modal", function () {
        $("#realizar_venta").html("Realizar venta");
        $("#pago_usuario").val("").parent().removeClass('has-error');
        $("#codigo_producto").focus();
    });

    // Tecleo de 
    $("#codigo_producto").keydown(function (evento) {
        // if (evento.ctrlKey) evento.preventDefault();

        switch (evento.keyCode) {
            case TECLA_ENTER:
                comprueba_si_existe_codigo($(this).val());
                break;
            case TECLA_F1:
                preparar_para_realizar_venta();
                evento.preventDefault();
                break;
            case TECLA_F2:
                cancelar_venta();
                evento.preventDefault();
                break;
            case TECLA_MENOS:
                quitar_ultimo_producto();
                evento.preventDefault();
                break;
            default:
                // statements_def
                break;
        }
    });

    $(document).on("keyup", ".modificar-cantidad", function (evento) {
        $(this).parent().removeClass('has-error');
        if (evento.keyCode === 13) {
            var nueva_cantidad = $(this).val(),
                posicion = dame_posicion_producto($(this).data("pos"));
            if (
                nueva_cantidad.length > 0
                && nueva_cantidad > 0
                && !isNaN(nueva_cantidad)
            ) {
                productos_vender[posicion].setCantidad(nueva_cantidad);
                dibujar_productos();
                $("#codigo_producto").focus();
            } else {
                $(this).animateCss('shake');
                $(this).parent().addClass('has-error');
            }
        }

    });

    $(document).on("mouseout", ".modificar-cantidad", function () {
        $(this).parent().removeClass('has-error');
        var nueva_cantidad = $(this).val(),
            posicion = dame_posicion_producto($(this).data("pos"));
        if (
            nueva_cantidad.length > 0
            && nueva_cantidad > 0
            && !isNaN(nueva_cantidad)
        ) {
            productos_vender[posicion].setCantidad(nueva_cantidad);
            dibujar_productos();
            $(this).focus();
        } else {
            $(this).animateCss('shake');
            $(this).parent().addClass('has-error');
            $(this).focus();
        }
    });


    $(document).on("click", ".quitar-producto", function () {
        var posicion = $(this).data("pos");
        quita_producto_local(posicion);
    });
}

function autocompletado_input() {
    var opciones = {
        theme: "bootstrap",

        url: function (busqueda) {
            var sugerencias = "./modulos/ventas/autocompletado.php?busqueda=" + busqueda;
            return sugerencias;
        },

        getValue: function (producto) {
            return producto.nombre;
        },

        requestDelay: 200,

        list: {
            maxNumberOfElements: 20,


            onChooseEvent: function () {
                var producto_seleccionado = $("#codigo_producto").getSelectedItemData();
                comprueba_si_existe_codigo(producto_seleccionado.codigo);
            },

            showAnimation: {
                type: "fade", //normal|fade|fade
                time: 100
            },

            hideAnimation: {
                type: "fade", //normal|fade|fade
                time: 100
            }
        }
    };

    $("#codigo_producto").easyAutocomplete(opciones);
}


function comprueba_si_existe_codigo(codigo) {
    $.post('./modulos/ventas/comprueba_si_existe_codigo.php', { "codigo": codigo }, function (respuesta) {
        $("#codigo_producto")
            .val("")
            .trigger(
                jQuery.Event(
                    'keyup', {
                    keyCode: 27,
                    which: 27
                }
                )
            )
            .focus();
        respuesta = JSON.parse(respuesta);
        if (respuesta !== false) {
            agrega_producto_local(respuesta);
        }

    });
}
