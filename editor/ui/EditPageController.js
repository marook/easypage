app.controller('EditPageController', function($scope, $stateParams){
    function main(){
        initScope();
    }

    function initScope(){
        // TODO load from server with $stateParams.pageId
        $scope.page = {
            title: 'Meine Seite',
            content: [
                {
                    "type": "headline",
                    "text": "Overview"
                },
                {
                    "type": "paragraph",
                    "text": "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
                },
                {
                    "type": "image",
                    "src": "view.jpg",
                    "title": "You see some grass."
                },
                {
                    "type": "image",
                    "src": "tree.jpg",
                    "title": "You see a tree."
                }
            ]
        };
    }

    main();
});
