let app = angular.module("myApp",[]);


app.controller("myController", ($scope,$http, $interval)=>{

    function goodNumber(number){
        number=number<10?"0"+number:number.toString();
        return number;
    }

    function getFecha(anio, mes, dia){
        let fechaActual = new Date();
        const fechaFuturo = new Date(anio, mes-1, dia);
        
        const resta = fechaFuturo-fechaActual;
        let retorno= null;
        if (resta >0){
            dias = goodNumber(Math.floor(resta/84000000));
            let resto= Math.floor(resta%84000000);
            horas = goodNumber(Math.floor(resto/3600000));
            resto= Math.floor(resto%3600000);
            minutos= goodNumber(Math.floor(resto/60000));
            resto= Math.floor(resto%60000);
            segundos = goodNumber(Math.floor(resto/1000))
    
            retorno ={"d":dias, "h":horas, "m":minutos,"s":segundos, "expired":false};
        }else { retorno ={"d":"00", "h":"00", "m":"00", "s":"00", "expired":true};}
        return retorno;
    }


    const reloj = () => { if ($scope.data!== undefined) $scope.fecha = getFecha($scope.data.promo.tiempo.anio, $scope.data.promo.tiempo.mes, $scope.data.promo.tiempo.dia); }
    reloj();
    $interval(reloj, 1000);

    $http.get('data.json').then((_data)=>{
        $scope.data=_data.data;
        
    })

})
