app.controller('EditPageController', function($scope, $q, $state, $stateParams, $uibModal, CONTENT_SEGMENT_TYPE_TITLES, Server, ErrorHandler){
    function main(){
        initScope();
        fetchPage();
    }

    function initScope(){
        $scope.CONTENT_SEGMENT_TYPE_TITLES = CONTENT_SEGMENT_TYPE_TITLES;
        $scope.pageLoading = false;
        $scope.pageSaving = false;
        $scope.page = null;
        $scope.listStyles = [
            {
                id: undefined,
                title: "<standard>",
            },
            {
                id: 'none',
                title: 'keine',
            },
            {
                id: 'bullets',
                title: 'Punkt',
            },
        ];

        $scope.moveContentSegmentUpwards = moveContentSegmentUpwards;
        $scope.moveContentSegmentDownwards = moveContentSegmentDownwards;
        $scope.removeContentSegment = removeContentSegment;
        $scope.addContentSegment = addContentSegment;
        $scope.addLineToListContentSegment = addLineToListContentSegment;
        $scope.removeContentSegmentListLine = removeContentSegmentListLine;
        $scope.savePage = savePage;
        $scope.cancel = cancel;
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

    function addLineToListContentSegment(contentSegment){
        contentSegment.lines.push('');
    }

    function removeContentSegmentListLine(contentSegment, removedLineIndex){
        contentSegment.lines.splice(removedLineIndex, 1);
    }

    function savePage(){
        $scope.pageSaving = true;
        return $q.when()
            .then(function(){
                if(!$scope.pageLoading){
                    // TODO save
                }
            })
            .then(function(){
                return $state.go('site');
            })
            .catch(ErrorHandler.handleError)
            .finally(function(){
                $scope.pageSaving = false;
            });
    }

    function cancel(){
        $state.go('site');
    }

    function fetchPage(){
        $scope.pageLoading = true;
        return $q.when()
            .then(function(){
                return Server.getPage($stateParams.pageId);
            })
            .then(function(page){
                $scope.page = page;
            })
            .catch(ErrorHandler.handleError)
            .finally(function(){
                $scope.pageLoading = false;
            });
    }

    main();
});
