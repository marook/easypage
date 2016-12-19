app.directive('busyIndicator', function(){
    function renderTemplate(){
        let html = '<div class="sk-cube-grid">';
        for(let i = 1; i <= 9; ++i){
            html += '<div class="sk-cube sk-cube' + i + '"></div>';
        }
        html += '</div>';
        return html;
    }
    
    return {
        restrict: 'E',
        template: renderTemplate(),
    };
});
