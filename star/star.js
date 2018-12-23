// Cuando hace click 
$(".fa-star").click(function(){
    $seleccionado= $(this);
    $clasificacion=$seleccionado.parent().data("index");
    $todos= $(".fa-star").parent();

    jQuery.each($todos, function(i, item){
        $indice = $(item).data("index");
        if ($indice <= $clasificacion){
            $(this).removeClass("semi-activo");
            $(this).removeClass("inactivo");
            $(item).addClass("activo");
        }
    })
})

$(".fa-star").mouseover(function(){
    $seleccionado= $(this);
    $parcial=$seleccionado.parent().data("index");

    $(".label-star").text($parcial);
    $todos= $(".fa-star").parent();

    jQuery.each($todos, function(i, item){
        $(item).addClass("inactivo");
        $indice = $(item).data("index");
        if ($indice <= $parcial){
            $(this).removeClass("inactivo");
            $(this).removeClass("activo");
            $(item).addClass("semi-activo");
        }
    })

})
