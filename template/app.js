(function () {

let app = angular.module("myApp",[]);

app.controller("myController", ($scope,$http)=>{

    $http.get('data.json').then((_data)=>{
        $scope.data=_data.data;
    })

})


})();