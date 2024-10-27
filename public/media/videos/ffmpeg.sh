# #!/bin/bash
declare -a files=("2892038-uhd_3840_2160_30fps.mp4" "6423982-uhd_2160_3840_29fps.mp4" "7170778-uhd_4096_2160_25fps.mp4" 
"7505754-uhd_2160_3840_30fps.mp4" "4764773-uhd_2160_3840_30fps.mp4" "2018959-hd_1920_1080_30fps.mp4" 
"5904599-hd_1080_1920_30fps.mp4" "7196106-uhd_3840_2160_25fps.mp4" "6157979-hd_1920_1080_30fps.mp4" 
"4081736-uhd_3840_2160_24fps.mp4" "5992350-hd_1920_1080_30fps.mp4" "10727436-hd_1920_1080_24fps.mp4"
"3960164-uhd_2160_4096_25fps.mp4" "8828853-uhd_2160_3840_30fps.mp4" "6157331-hd_1920_1080_30fps.mp4" 
"7037850-uhd_3840_2160_30fps.mp4" "6700174-uhd_2160_3840_25fps.mp4" "7092080-hd_1920_1080_30fps.mp4" 
"4008176-uhd_2160_4096_25fps.mp4" "5381274-uhd_4096_2160_30fps.mp4" "6379426-uhd_3840_2160_24fps.mp4" 
"7966582-uhd_3840_2160_25fps.mp4" "1580117-uhd_3840_2160_30fps.mp4" "4993317-hd_1920_1080_30fps.mp4" 
"10040768-hd_1920_1080_24fps.mp4" "1874710-hd_2048_1024_30fps.mp4" "6093239-uhd_3840_2160_24fps.mp4" 
"13801273-uhd_2160_3840_24fps.mp4" "4046200-hd_1920_1080_25fps.mp4" "8721927-uhd_2160_4096_25fps.mp4")
for i in "${files[@]}";
do
    mkdir ./${i}_dir;
    ffmpeg -i $i \
    -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 \
    -b:v:0 254k  -c:v:0 libx264 -filter:v:0 "scale=320:180"  \
    -b:v:1 507k -c:v:1 libx264 -filter:v:1 "scale=320:180"  \
    -b:v:2 759k -c:v:2 libx264 -filter:v:2 "scale=480:270" \
    -b:v:3 1013k  -c:v:3 libx264 -filter:v:3 "scale=640:360"  \
    -b:v:4 1254k -c:v:4 libx264 -filter:v:4 "scale=640:360"  \
    -b:v:5 1883k -c:v:5 libx264 -filter:v:5 "scale=768:432"  \
    -b:v:6 3134k -c:v:6 libx264 -filter:v:6 "scale=1024:576"  \
    -b:v:7 4952k -c:v:7 libx264 -filter:v:7 "scale=1280:720"  \
    -use_timeline 1 -use_template 1 -window_size 5 -seg_duration 10 -media_seg_name 'chunk_$Bandwidth$_$Number%01d$.m4s' -adaptation_sets "id=0,streams=v" \
    -hls_playlist true -f dash ./${i}_dir/$i.mpd;
done
# for i in "${files[@]}"
# do
#    exec ffmpeg -i $i \
#     -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 -map 0:v:0 \
#     -b:v:0 254k  -c:v:0 libx264 -filter:v:0 "scale=320:180"  \
#     -b:v:1 507k -c:v:1 libx264 -filter:v:1 "scale=320:180"  \
#     -b:v:2 759k -c:v:2 libx264 -filter:v:2 "scale=480:270" \
#     -b:v:3 1013k  -c:v:3 libx264 -filter:v:3 "scale=640:360"  \
#     -b:v:4 1254k -c:v:4 libx264 -filter:v:4 "scale=640:360"  \
#     -b:v:5 1883k -c:v:5 libx264 -filter:v:5 "scale=768:432"  \
#     -b:v:6 3134k -c:v:6 libx264 -filter:v:6 "scale=1024:576"  \
#     -b:v:7 4952k -c:v:7 libx264 -filter:v:7 "scale=1280:720"  \
#     -use_timeline 1 -use_template 1 -window_size 5 -seg_duration 10 -media_seg_name 'chunk_$Bandwidth$_$Number%01d$.m4s' -adaptation_sets "id=0,streams=v" \
#     -hls_playlist true -f dash $i.mpd
#     cd ..
# done
