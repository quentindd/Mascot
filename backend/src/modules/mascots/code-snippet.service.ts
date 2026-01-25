import { Injectable } from '@nestjs/common';
import { CodeSnippetResponseDto, CodeSnippetPlatform, ExportFormatsResponseDto } from './dto/code-snippet.dto';

@Injectable()
export class CodeSnippetService {
  /**
   * Generate code snippets for embedding mascot/animation in various platforms
   */
  generateSnippets(assetUrl: string, isVideo: boolean = true): CodeSnippetResponseDto[] {
    const snippets: CodeSnippetResponseDto[] = [];

    // HTML
    snippets.push({
      platform: CodeSnippetPlatform.HTML,
      code: this.generateHTMLSnippet(assetUrl, isVideo),
      description: 'HTML5 video/image tag with autoplay and transparency',
    });

    // React
    snippets.push({
      platform: CodeSnippetPlatform.REACT,
      code: this.generateReactSnippet(assetUrl, isVideo),
      description: 'React component with video/image element',
    });

    // Expo
    snippets.push({
      platform: CodeSnippetPlatform.EXPO,
      code: this.generateExpoSnippet(assetUrl, isVideo),
      description: 'React Native Expo Video/Image component',
    });

    // Flutter
    snippets.push({
      platform: CodeSnippetPlatform.FLUTTER,
      code: this.generateFlutterSnippet(assetUrl, isVideo),
      description: 'Flutter VideoPlayer/Image widget',
    });

    // iOS Swift
    snippets.push({
      platform: CodeSnippetPlatform.IOS_SWIFT,
      code: this.generateSwiftSnippet(assetUrl, isVideo),
      description: 'iOS Swift AVPlayer/UIImageView',
    });

    // Android Kotlin
    snippets.push({
      platform: CodeSnippetPlatform.ANDROID_KOTLIN,
      code: this.generateKotlinSnippet(assetUrl, isVideo),
      description: 'Android Kotlin ExoPlayer/ImageView',
    });

    return snippets;
  }

  private generateHTMLSnippet(url: string, isVideo: boolean): string {
    if (isVideo) {
      return `<video 
  src="${url}" 
  autoplay 
  loop 
  muted 
  playsinline
  style="background: transparent; width: 300px; height: 300px;"
></video>`;
    } else {
      return `<img 
  src="${url}" 
  alt="Mascot" 
  style="width: 300px; height: 300px;"
/>`;
    }
  }

  private generateReactSnippet(url: string, isVideo: boolean): string {
    if (isVideo) {
      return `<video
  src="${url}"
  autoPlay
  loop
  muted
  playsInline
  style={{ background: 'transparent', width: 300, height: 300 }}
/>`;
    } else {
      return `<img 
  src="${url}" 
  alt="Mascot" 
  style={{ width: 300, height: 300 }}
/>`;
    }
  }

  private generateExpoSnippet(url: string, isVideo: boolean): string {
    if (isVideo) {
      return `import { Video } from 'expo-av';

<Video
  source={{ uri: '${url}' }}
  resizeMode="contain"
  shouldPlay
  isLooping
  isMuted
  style={{ width: 300, height: 300 }}
/>`;
    } else {
      return `import { Image } from 'react-native';

<Image
  source={{ uri: '${url}' }}
  resizeMode="contain"
  style={{ width: 300, height: 300 }}
/>`;
    }
  }

  private generateFlutterSnippet(url: string, isVideo: boolean): string {
    if (isVideo) {
      return `import 'package:video_player/video_player.dart';

VideoPlayer(
  VideoPlayerController.network('${url}')
    ..initialize()
    ..setLooping(true)
    ..play(),
)`;
    } else {
      return `Image.network(
  '${url}',
  width: 300,
  height: 300,
  fit: BoxFit.contain,
)`;
    }
  }

  private generateSwiftSnippet(url: string, isVideo: boolean): string {
    if (isVideo) {
      return `import AVKit

let player = AVPlayer(url: URL(string: "${url}")!)
let playerLayer = AVPlayerLayer(player: player)
playerLayer.frame = CGRect(x: 0, y: 0, width: 300, height: 300)
playerLayer.videoGravity = .resizeAspect
view.layer.addSublayer(playerLayer)
player.play()`;
    } else {
      return `import UIKit

let imageView = UIImageView()
imageView.frame = CGRect(x: 0, y: 0, width: 300, height: 300)
imageView.contentMode = .scaleAspectFit
if let url = URL(string: "${url}") {
    // Use URLSession or SDWebImage to load
}`;
    }
  }

  private generateKotlinSnippet(url: string, isVideo: boolean): string {
    if (isVideo) {
      return `import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem

val player = ExoPlayer.Builder(context).build()
val mediaItem = MediaItem.fromUri("${url}")
player.setMediaItem(mediaItem)
player.repeatMode = Player.REPEAT_MODE_ALL
player.prepare()
player.play()`;
    } else {
      return `import android.widget.ImageView
import coil.load

val imageView: ImageView = findViewById(R.id.mascot)
imageView.load("${url}") {
    crossfade(true)
}`;
    }
  }

  /**
   * Get export formats for a mascot/animation
   */
  getExportFormats(
    webmUrl: string | null,
    movUrl: string | null,
    pngUrl: string | null,
  ): ExportFormatsResponseDto {
    const bestVideoUrl = webmUrl || movUrl;
    
    return {
      webmUrl,
      movUrl,
      pngUrl,
      snippets: this.generateSnippets(bestVideoUrl || pngUrl, !!bestVideoUrl),
    };
  }
}
