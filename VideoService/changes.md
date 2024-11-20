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

TODO:
1. Create a new schema for videos (DONE)
2. Create a hashing system for videos (BYPASS: Made a UID system instaed)
    1. Create a script to insert the hash into the database (DONE)
    2. ADDENDUM: We need to hash BEFORE encoding (DONE)
        1. We will use video-hash to generate the hash (BYPASS)
        1. We use the hash as the identifier for the video (DONE)
    3. ADDENDUM: We need to modify the /api/videos route to return the new ids (DONE ?)
4. Create a video uploading system (with ffmpeg) (DONE)
5. Create an upload page (DONE)
6. Create a processing status page (NOT NEEDED)


Milestone 3
POST /api/upload { author, title, description, mp4File}
Upload a video to the site with title: title and author: author, description: description and mp4file: is the mp4 file.
Response format: {id: string}


1. Move ffmpeg off machine
    1. Build a testing frontend point
2. Move storage to ceph
3. 