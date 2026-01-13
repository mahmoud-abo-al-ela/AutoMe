const TestDriveSkeleton = () => {
    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row animate-pulse">
                <div className="w-full sm:w-40 h-32 bg-gray-200"></div>
                <div className="p-4 flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-px bg-gray-200 my-3"></div>
                    <div className="flex flex-wrap gap-2">
                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestDriveSkeleton;