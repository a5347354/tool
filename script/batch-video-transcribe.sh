#!/bin/bash

# 設定OpenAI API密鑰（建議使用環境變數）
OPENAI_API_KEY="${OPENAI_API_KEY:-your_openai_api_key_here}"

# 檢查並安裝必要依賴
check_dependencies() {
    local dependencies=("ffmpeg" "curl")
    for dep in "${dependencies[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo "$dep 未安裝，正在安裝..."
            if ! command -v brew &> /dev/null; then
                echo "正在安裝 Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew update
            brew install "$dep"
        fi
    done
}

# 處理單個影片檔案
process_video() {
    local video_file="$1"
    local base_name=$(basename "$video_file" | sed 's/\.[^.]*$//')
    local work_dir="$(pwd)/transcribe_output"
    local chunk_dir="$work_dir/chunks_${base_name}"
    
    echo "處理影片: $video_file"
    
    # 創建輸出目錄
    mkdir -p "$work_dir" "$chunk_dir"
    
    # 分離音訊並轉換為MP3
    echo "分離音訊..."
    ffmpeg -i "$video_file" -vn -acodec libmp3lame -b:a 128k "$work_dir/${base_name}.mp3"
    
    # 檢查檔案大小
    local file_size=$(stat -f%z "$work_dir/${base_name}.mp3")
    if [ $file_size -gt 25000000 ]; then
        echo "音訊檔案過大，進行分割處理..."
        # 使用 ffmpeg 將音訊分割成多個較小的片段（每段 10 分鐘）
        ffmpeg -i "$work_dir/${base_name}.mp3" -f segment -segment_time 600 -c copy "$chunk_dir/chunk_%03d.mp3"
        
        # 處理每個分割後的音訊檔
        local combined_srt=""
        local time_offset=0
        for chunk in "$chunk_dir"/*.mp3; do
            echo "處理分割檔案: $chunk"
            local response=$(curl https://api.openai.com/v1/audio/transcriptions \
                -H "Authorization: Bearer $OPENAI_API_KEY" \
                -H "Content-Type: multipart/form-data" \
                -F file="@$chunk" \
                -F model="whisper-1" \
                -F response_format="srt")
            
            # 調整時間碼並合併字幕
            if [ $time_offset -gt 0 ]; then
                response=$(echo "$response" | awk -v offset=$time_offset '
                    BEGIN { RS="" ; FS="\n" }
                    {
                        split($2,times," --> ")
                        split(times[1],t1,":")
                        split(times[2],t2,":")
                        t1_seconds = (t1[1]*3600 + t1[2]*60 + t1[3])
                        t2_seconds = (t2[1]*3600 + t2[2]*60 + t2[3])
                        t1_seconds += offset
                        t2_seconds += offset
                        printf "%d\n%02d:%02d:%02d,000 --> %02d:%02d:%02d,000\n%s\n\n",
                            NR,
                            int(t1_seconds/3600), int((t1_seconds%3600)/60), int(t1_seconds%60),
                            int(t2_seconds/3600), int((t2_seconds%3600)/60), int(t2_seconds%60),
                            $3
                    }
                ')
            fi
            combined_srt="${combined_srt}${response}\n\n"
            time_offset=$((time_offset + 600))
        done
        
        # 保存合併後的字幕檔
        echo -e "$combined_srt" > "$work_dir/${base_name}.srt"
    else
        # 直接處理小檔案
        echo "開始轉錄音訊..."
        response=$(curl https://api.openai.com/v1/audio/transcriptions \
            -H "Authorization: Bearer $OPENAI_API_KEY" \
            -H "Content-Type: multipart/form-data" \
            -F file="@$work_dir/${base_name}.mp3" \
            -F model="whisper-1" \
            -F response_format="srt")
        
        echo "$response" > "$work_dir/${base_name}.srt"
    fi
    
    echo "字幕已生成：$work_dir/${base_name}.srt"
    
    # 清理暫時檔案
    rm -rf "$chunk_dir"
    rm "$work_dir/${base_name}.mp3"
}

# 主腳本
main() {
    # 檢查依賴
    check_dependencies
    
    # 檢查video目錄是否存在
    if [ ! -d "video" ]; then
        echo "錯誤：找不到 'video' 目錄"
        exit 1
    fi
    
    # 處理所有影片檔案
    echo "開始處理影片檔案..."
    find "video" -type f \( -name "*.mp4" -o -name "*.avi" -o -name "*.mov" -o -name "*.mkv" \) | while read -r video_file; do
        process_video "$video_file"
    done
    
    echo "所有影片處理完成！"
}

# 執行主腳本
main 