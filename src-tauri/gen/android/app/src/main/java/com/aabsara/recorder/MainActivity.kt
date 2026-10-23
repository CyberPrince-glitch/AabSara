package com.aabsara.recorder

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : TauriActivity() {
  private val REQUIRED_PERMISSIONS = buildList {
    add(Manifest.permission.RECORD_AUDIO)
    add(Manifest.permission.CAMERA)
    add(Manifest.permission.MODIFY_AUDIO_SETTINGS)
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S_V2) {
      add(Manifest.permission.READ_EXTERNAL_STORAGE)
      add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
    }
  }.toTypedArray()

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    checkAndRequestPermissions()
  }

  private fun checkAndRequestPermissions() {
    val missing = REQUIRED_PERMISSIONS.filter {
      ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
    }
    if (missing.isNotEmpty()) {
      ActivityCompat.requestPermissions(this, missing.toTypedArray(), 1001)
    }
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webView.webChromeClient = object : WebChromeClient() {
      override fun onPermissionRequest(request: PermissionRequest?) {
        runOnUiThread {
          request?.grant(request.resources)
        }
      }
    }
  }
}
