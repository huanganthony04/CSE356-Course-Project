4. POST /api/upload { author, title, mp4file}
Upload a video to the site with title: title and author: author and mp4file: is the mp4 file.
Response format: {id: string}

5. POST /api/view { id }
Mark video “id” as viewed by the logged in user.  This API call should be made by the UI on videos that were not previously watched whenever that video is first “played” for the user. 
Response format: {viewed: Boolean}, viewed = true if user has viewed this post before and false otherwise

6. GET /upload
Expects an HTML page where videos can be uploaded from

7. GET /api/processing-status
Returns a list of uploaded videos for the logged in user.
Response format: { videos: [{ id: string, title: string, status: string }] }
where status can be "processing" or "complete", where “processing” indicates the file has been received, but not yet available for viewing.