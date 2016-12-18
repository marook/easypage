app.controller('ChooseContentSegmentTypeController', function($scope, $uibModalInstance, CONTENT_SEGMENT_TYPE_TITLES){
    function main(){
        initScope();
    }

    function initScope(){
        $scope.contentSegmentTypes =
            Array.from(CONTENT_SEGMENT_TYPE_TITLES)
            .map(([type, title]) => ({
                type,
                title,
            }));
        $scope.contentSegmentTypes.sort(function(left, right){
            const lTitle = left.title;
            const rTitle = right.title;
            return (lTitle < rTitle) ? -1 : ((rTitle < lTitle) ? 1 : 0);
        });
        $scope.contentSegmentType = null;
        
        $scope.submitContentSegmentType = submitContentSegmentType;
        $scope.cancel = cancel;
    }

    function submitContentSegmentType(){
        return $uibModalInstance.close($scope.contentSegmentType);
    }

    function cancel(){
        return $uibModalInstance.dismiss();
    }

    main();
});
