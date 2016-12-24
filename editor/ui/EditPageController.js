app.controller('EditPageController', function($scope, $q, $state, $stateParams, $uibModal, CONTENT_SEGMENT_TYPE_TITLES, Server, ErrorHandler, FileUploader){
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
                const contentSegment = {
                    type: contentSegmentType,
                };
                prepareContentSegmentForScope(contentSegment);
                $scope.page.content.push(contentSegment);
            });
    }

    function prepareContentSegmentForScope(contentSegment){
        switch(contentSegment.type){
        case 'list':
            contentSegment.lines = contentSegment.lines || [];
            break;
        case 'image':
            contentSegment.imageUploader = buildImageUploader(contentSegment);
            break;
        }
    }

    function buildImageUploader(contentSegment){
        const uploader = new FileUploader({
            url: '/api/images',
        });
        uploader.autoUpload = true;
        uploader.onCompleteItem = function(fileItem, response, status, headers){
            contentSegment.src = response;
        };
        return uploader;
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
                    return Server.updatePage($stateParams.pageId, buildPageDescription());
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

    function buildPageDescription(){
        const page = $scope.page;
        return {
            title: page.title,
            content: page.content.map(function(cs){
                switch(cs.type){
                default:
                    return cs;
                case 'image':
                    return {
                        type: cs.type,
                        src: cs.src,
                    };
                };
            }),
        };
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
                for(let contentSegment of page.content){
                    prepareContentSegmentForScope(contentSegment);
                }
                $scope.page = page;
            })
            .catch(ErrorHandler.handleError)
            .finally(function(){
                $scope.pageLoading = false;
            });
    }

    main();
});
