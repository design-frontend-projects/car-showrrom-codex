# Landing Pages

Reusable public page components for catalog, content, and contact views. Route data selects translated content for shared page templates.

`/used-cars` and `/new-cars` attach `vehicleConditionScope` route metadata and resolve catalog results before activation. Public filters send query parameters plus the active inventory scope to `/api/showroom/listings`; dropdowns use focused `/api/showroom/options/:entity` requests and dependent make/model/trim loading instead of a full taxonomy preload.
