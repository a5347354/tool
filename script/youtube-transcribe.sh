#!/bin/bash

# 檢查並安裝必要依賴
install_dependencies() {
    # 檢查 Homebrew 是否安裝
    if ! command -v brew &> /dev/null; then
        echo "正在安裝 Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi

    # 更新 Homebrew
    brew update

    # 安裝必要工具
    brew install \
        curl \
        ffmpeg \
        yt-dlp
}

# 檢查依賴是否已安裝
check_dependencies() {
    local dependencies=("yt-dlp" "ffmpeg" "curl")
    for dep in "${dependencies[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo "$dep 未安裝，正在安裝..."
            install_dependencies
            break
        fi
    done
}

# 設定OpenAI API密鑰（建議使用環境變數）
OPENAI_API_KEY="${OPENAI_API_KEY:-your_openai_api_key_here}"

# 主腳本開始
main() {
    # 檢查依賴
    check_dependencies

    # 檢查是否提供YouTube影片URL
    if [ $# -eq 0 ]; then
        echo "請提供YouTube影片URL"
        exit 1
    fi

    # 影片URL
    VIDEO_URL=$1

    # 使用當前目錄作為工作目錄
    WORK_DIR="$(pwd)"

    # 創建子目錄以防止文件衝突
    mkdir -p "$WORK_DIR/yt_transcribe"
    cd "$WORK_DIR/yt_transcribe"

    # 下載YouTube影片
    yt-dlp -f bestaudio "$VIDEO_URL" -o "audio.%(ext)s"

    # 找到下載的音訊文件
    AUDIO_FILE=$(find . -type f -name "audio.*")

    # 轉換為MP3（如果不是MP3格式）
    ffmpeg -i "$AUDIO_FILE" -acodec libmp3lame -b:a 128k audio.mp3

    # 使用OpenAI Whisper API轉錄整個音訊
    echo "開始轉錄音訊..."
    response=$(curl https://api.openai.com/v1/audio/transcriptions \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -H "Content-Type: multipart/form-data" \
        -F file="@audio.mp3" \
        -F model="whisper-1" \
        -F response_format="srt")
    
    # 保存字幕到當前目錄的上一層
    echo "$response" > "$WORK_DIR/subtitles.srt"

    # 顯示字幕位置
    echo "字幕已生成：$WORK_DIR/subtitles.srt"
}

# 執行主腳本
main "$@"
