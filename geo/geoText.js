var $respuesta= $("#respuesta"); // output para feedback
var $text= $('#busqueda'); // input 

var app_id='B1kx1fZGKnMDKQV8baQf'; // app_id del API HERE
var app_code='fI3klVDosc8PwK48ljw2dQ'; // app_code del API HERE

// Solicita permisos de ubicación
function traerUbicacion(){
    var posicion;
    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(actualizarPosicion);
    }
    else{
        $respuesta.text("no tenemos acceso a tu ubicación");
    }
}

// En base a lat,long obtener el nombre de la ciudad
function actualizarPosicion(posicion){

    /* Prueba: Mostrar lat y long
        $respuesta.text(`latitud:  ${posicion.coords.latitude} longitud: ${posicion.coords.longitude}`);
    */ 
    var api_dir='https://reverse.geocoder.api.here.com/6.2/reversegeocode.json';   

    $.ajax({
    url: api_dir,
    type: 'GET',
    dataType: 'jsonp',
    jsonp: 'jsoncallback',
    data:{
        prox: `${posicion.coords.latitude},${posicion.coords.longitude},150`,
        mode: 'retrieveAddresses',
        maxresults: '1',
        app_id: app_id,
        app_code: app_code
    },
    success: function(response) {
        $('#busqueda').val(response.Response.View[0].Result[0].Location.Address.City);
        $respuesta.text("Tu lugar fue encontrado correctamente");
        },
    error:function(e){
        $respuesta.text("no se obtuvo posición");
    }
    });   
}

// en caso de cambiar texto
$text.on('input',function(e){
    texto_ingresado=$text[0].value;
    cambiarTexto(texto_ingresado);
});

// agregar sugerencias al texto
function cambiarTexto(query){

    var api_dir='http://autocomplete.geocoder.api.here.com/6.2/suggest.json';   

    $.ajax({
        url: api_dir,
        type: 'GET',
        dataType: 'jsonp',
        jsonp: 'jsoncallback',
        data:{
            app_id: app_id,
            app_code: app_code,
            query:query,
            language:'es',
            matchLevel: 'city',
        },
        success: function(response) {
            $("#list").empty();
            if (response.suggestions != null) {
                for(sug of response.suggestions){
                    if (sug.matchLevel=='city'){
                        $option= `<option> ${sug.label}</option>`;
                        $("#list").append($($option));

                        /* Prueba: Separar ciudad de país.
                            console.log(sug.label.split(",")[3]);
                        */
                    }
                }
            }
        },
        
        });

}



