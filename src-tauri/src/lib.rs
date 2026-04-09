mod onedrive;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = {
        let b = tauri::Builder::default()
            .manage(onedrive::OauthPending::default())
            .plugin(tauri_plugin_deep_link::init());
        #[cfg(not(any(target_os = "android", target_os = "ios")))]
        {
            b.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
                use std::ops::Deref;

                use tauri::Manager;
                use url::Url;

                let Some(pending_state) = app.try_state::<onedrive::OauthPending>() else {
                    return;
                };
                let pending = pending_state.deref().clone();

                for arg in argv.iter() {
                    let arg = arg.trim_matches('"');
                    let Ok(url) = Url::parse(arg) else {
                        continue;
                    };
                    if url.scheme() == "media-tracker" {
                        onedrive::handle_oauth_redirect_url(app, &pending, &url.to_string());
                        break;
                    }
                }
            }))
        }
        #[cfg(any(target_os = "android", target_os = "ios"))]
        {
            b
        }
    };

    builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            onedrive::onedrive_sign_in,
            onedrive::onedrive_sign_out,
            onedrive::onedrive_status,
            onedrive::onedrive_push,
            onedrive::onedrive_pull,
        ])
        .setup(|app| {
            use std::ops::Deref;

            use tauri::{Listener, Manager};
            use tauri_plugin_deep_link::DeepLinkExt;

            let app_handle = app.handle().clone();
            let pending: onedrive::OauthPending =
                app.state::<onedrive::OauthPending>().deref().clone();
            let pending_listen = pending.clone();
            let h_listen = app_handle.clone();

            let _ = app.listen("deep-link://new-url", move |event| {
                let payload = event.payload();
                if let Ok(urls) = serde_json::from_str::<Vec<String>>(payload) {
                    for s in urls {
                        onedrive::handle_oauth_redirect_url(&h_listen, &pending_listen, &s);
                    }
                } else if let Ok(urls) = serde_json::from_str::<Vec<url::Url>>(payload) {
                    for u in urls {
                        onedrive::handle_oauth_redirect_url(
                            &h_listen,
                            &pending_listen,
                            &u.to_string(),
                        );
                    }
                }
            });

            if let Ok(Some(urls)) = app.deep_link().get_current() {
                for u in urls {
                    onedrive::handle_oauth_redirect_url(&app_handle, &pending, &u.to_string());
                }
            }

            #[cfg(not(target_os = "android"))]
            {
                let _ = app.deep_link().register_all();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
