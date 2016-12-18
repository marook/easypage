app.controller('EditPageController', function($scope, $q, $stateParams, $uibModal, CONTENT_SEGMENT_TYPE_TITLES){
    function main(){
        initScope();
    }

    function initScope(){
        // TODO load from server with $stateParams.pageId
        $scope.CONTENT_SEGMENT_TYPE_TITLES = CONTENT_SEGMENT_TYPE_TITLES;
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

        $scope.moveContentSegmentUpwards = moveContentSegmentUpwards;
        $scope.moveContentSegmentDownwards = moveContentSegmentDownwards;
        $scope.removeContentSegment = removeContentSegment;
        $scope.addContentSegment = addContentSegment;
    }

    function moveContentSegmentUpwards(contentSegmentIndex){
        switchContentSegments(contentSegmentIndex - 1, contentSegmentIndex);
    }

    function moveContentSegmentDownwards(contentSegmentIndex){
        switchContentSegments(contentSegmentIndex, contentSegmentIndex + 1);
    }

    function switchContentSegments(i1, i2){
        const otherSegment = $scope.page.content[i1];
        $scope.page.content[i1] = $scope.page.content[i2];
        $scope.page.content[i2] = otherSegment;
    }

    function removeContentSegment(contentSegmentIndex){
        $scope.page.content.splice(contentSegmentIndex, 1);
    }

    function addContentSegment(){
        return $q.when()
            .then(function(){
                return $uibModal.open({
                    templateUrl: 'chooseContentSegmentType.html',
                    controller: 'ChooseContentSegmentTypeController',
                }).result;
            })
            .then(function(contentSegmentType){
                $scope.page.content.push({
                    type: contentSegmentType,
                });
            });
    }

    main();
});
