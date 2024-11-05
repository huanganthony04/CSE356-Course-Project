#!/bin/bash

# ffmpeg -i $1 \
#     -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 \
#     -b:v:0 254k  -c:v:0 libx264 -filter:v:0 "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black, scale=320:180"  \
#     -b:v:1 507k -c:v:1 libx264 -filter:v:1 "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black, scale=320:180"  \
#     -b:v:2 759k -c:v:2 libx264 -filter:v:2 "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black, scale=480:270" \
#     -b:v:3 1013k  -c:v:3 libx264 -filter:v:3 "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black, scale=640:360"  \
#     -b:v:4 1254k -c:v:4 libx264 -filter:v:4 "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black, scale=640:360"  \
#     -b:v:5 1883k -c:v:5 libx264 -filter:v:5 "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black, scale=768:432"  \
#     -b:v:6 3134k -c:v:6 libx264 -filter:v:6 "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black, scale=1024:576"  \
#     -b:v:7 4952k -c:v:7 libx264 -filter:v:7 "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black, scale=1280:720"  \
#     -use_timeline 1 -use_template 1 -window_size 5 -seg_duration 10 -media_seg_name "${2}_chunk_\$Bandwidth\$_\$Number\$.m4s" -init_seg_name "${2}_init-stream\$RepresentationID\$.\$ext\$" -adaptation_sets "id=0,streams=v" \
#     -hls_playlist false -f dash $2.mpd;

ffmpeg -i $1 \
    -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 \
    -b:v:0 254k  -c:v:0 libx264 -filter:v:0 "scale=320:180:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black"  \
    -b:v:1 507k -c:v:1 libx264 -filter:v:1 "scale=320:180:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black"  \
    -b:v:2 759k -c:v:2 libx264 -filter:v:2 "scale=480:270:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black" \
    -b:v:3 1013k  -c:v:3 libx264 -filter:v:3 "scale=640:360:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black"  \
    -b:v:4 1254k -c:v:4 libx264 -filter:v:4 "scale=640:360:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black"  \
    -b:v:5 1883k -c:v:5 libx264 -filter:v:5 "scale=768:432:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black"  \
    -b:v:6 3134k -c:v:6 libx264 -filter:v:6 "scale=1024:576:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black"  \
    -b:v:7 4952k -c:v:7 libx264 -filter:v:7 "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black"  \
    -use_timeline 1 -use_template 1 -window_size 5 -seg_duration 10 -media_seg_name "${2}_chunk_\$Bandwidth\$_\$Number\$.m4s" -init_seg_name "${2}_init-stream\$RepresentationID\$.\$ext\$" -adaptation_sets "id=0,streams=v" \
    -hls_playlist false -f dash ./public/media/$2.mpd;