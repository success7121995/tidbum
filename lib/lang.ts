export enum Language {
    EN = 'en',
    ZH_TW = 'zh-TW',
    ZH_CN = 'zh-CN',
}

export const getLanguageText = (language: Language) => {
	switch (language) {
		case Language.ZH_TW:
			return {
				//===============================================
				// APP
				//===============================================
				appName: "Tidbum",
				back: "返回",

                //===============================================
                // ALBUM MANAGEMENT
                //===============================================
                // Album Creation & Editing
				createAlbum: "建立相簿",
				createAlbumSubtitle: "將您的照片和影片組織成美麗的相簿",
				editAlbum: "編輯相簿",
				updateAlbumDetails: "更新相簿詳細資訊",
				albumName: "相簿名稱",
				enterAlbumName: "請輸入相簿名稱",
				albumNameRequired: "相簿名稱是必填的",
				albumNameTooLong: "相簿名稱不能超過 50 個字元",
				enterAlbumDescription: "請輸入相簿描述 (可選)",
				saveAlbum: "儲存相簿",
				saving: "儲存中...",
				cancel: "取消",

                // Album Status & Navigation
				albumNotFound: "找不到相簿",
				loadingAlbum: "載入相簿中...",
				noAlbum: "沒有相簿",
				noDescription: "沒有描述",

                // Album Content Organization
				folders: "資料夾",
				media: "媒體",
				noMediaInAlbum: "此相簿中還沒有媒體",
				tapToAdd: "點擊 + 按鈕來新增照片和影片",

                // Album Actions
				addMediaOrNewFolder: "新增媒體或新資料夾",
				addMedia: "新增媒體",
				addNewFolder: "新增相簿",
				deleteAlbum: "此相簿將被刪除，包含所有子相簿和媒體項目。",
				
                // Album Navigation & Moving
				moveToAlbum: "移至相簿",
				parentAlbum: "父相簿",
				subAlbums: "子相簿",
				topLevelAlbums: "頂層相簿",
				noSubAlbums: "沒有子相簿",
				noSubAlbumsDescription: "此相簿沒有任何子相簿。您只能將資產移至父相簿。",
				currentAlbum: "當前",
				success: "成功",
				movedTo: "已移至",
				ok: "確定",
				moveAssetsError: "移動資產失敗。請重試。",
				confirm: "確認",
				loading: "載入中...",
				movingTo: "移至",

                //===============================================
                // MEDIA & ASSETS
                //===============================================
                // Media Types
				photo: "照片",
				photos: "照片",
				video: "影片",
				videos: "影片",
				asset: "個項目",
				assets: "個項目",

                // Media Actions
				delete: "刪除",
				deleteAsset: "刪除項目",
				deletePhoto: "刪除照片",
				deleteVideo: "刪除影片",
				deletingAssetMessage: "在此刪除此資產不會從您的媒體庫中移除它。",

                // Media Selection
				item: "項目",
				items: "項目",
				selected: "已選擇",

                //===============================================
                // PERMISSIONS & ACCESS
                //===============================================
                // Permission Requests
				checkingPermissions: "檢查權限中...",
				mediaAccessRequired: "需要媒體存取權限",
				mediaAccessDescription: "TidBum 需要存取您的照片和影片來幫助您組織和管理媒體庫。",
				toEnableAccess: "要啟用存取：",

                // Permission Instructions
				tapOpenSettings: "點擊下方的「開啟設定」",
				findTidBum: "在清單中找到「TidBum」",
				enablePhotosVideos: "啟用「照片和影片」",
				openSettings: "開啟設定",
				tryAgain: "重試",
				requesting: "請求中...",

                //===============================================
                // MEDIA LIBRARY
                //===============================================
                // Library Interface
				mediaLibrary: "媒體庫",
				library: "媒體庫",
				noMediaYet: "還沒有媒體",
				addPhotosVideos: "新增照片和影片",
				available: "可用",

                //===============================================
                // ALBUM SLIDER & VIEWER
                //===============================================
                // Caption Management
				editCaption: "編輯說明",
				addCaption: "新增說明...",

                //===============================================
                // COVER IMAGE MODAL
                //===============================================
                // Cover Image Selection
				selectedCoverImage: "已選擇",
				selectCoverImage: "選擇封面圖片",
				noPhotosAvailable: "沒有可用的照片",
				noPhotosAvailableMessage: "此相簿中沒有照片可以設為封面圖片。",
				changeCover: "變更封面",
				removeCover: "移除封面",
				setCover: "設定封面",
				noImageSelected: "未選擇圖片",
				coverImageSelected: "已選擇",

                //===============================================
                // SETTINGS & PREFERENCES
                //===============================================
                // Settings Navigation
				setting: "設定",
				language: "語言",
				languageSetting: "選擇語言",
				languageSubtitle: "繁體中文",

                // Appearance Settings
				appearance: "外觀",
				darkMode: "深色模式",
				darkModeSubtitle: "切換深色和淺色主題",

                // Help & Support
				helpSupport: "幫助與支援",
				helpCenter: "幫助中心",
				helpCenterSubtitle: "獲取使用幫助和支援",
				faq: "常見問題",
				faqSubtitle: "查看常見問題解答",

                // Legal & Terms
				legal: "法律條款",
				termsOfUse: "使用條款",
				termsOfUseSubtitle: "閱讀應用程式使用條款",
				privacyPolicy: "隱私政策",
				privacyPolicySubtitle: "了解我們的隱私政策",

                // App Information
				version: "版本 1.0.0",
				copyright: "© " + new Date().getFullYear() + " TidBum",

                //===============================================
                // ERROR MESSAGES & ALERTS
                //===============================================
                // General Errors
				error: "錯誤",

                // Operation Failures
				failedToUpdateLanguage: "無法更新語言。請重試。",
				failedToCreateAlbum: "無法建立相簿。請重試。",
				failedToSaveAlbum: "無法儲存相簿。請重試。",

                // External Link Failures
				cannotOpenHelpCenter: "無法開啟幫助中心",
				cannotOpenFAQ: "無法開啟常見問題",
				cannotOpenTerms: "無法開啟使用條款",
				cannotOpenPolicy: "無法開啟隱私政策",
			};
		case Language.ZH_CN:
			return {
				//===============================================
				// APP
				//===============================================
				appName: "Tidbum",
				back: "返回",

                //===============================================
                // ALBUM MANAGEMENT
                //===============================================
                // Album Creation & Editing
				createAlbum: "创建相簿",
				createAlbumSubtitle: "将您的照片和视频组织成美丽的相簿",
				editAlbum: "编辑相簿",
				updateAlbumDetails: "更新相簿详细信息",
				albumName: "相簿名称",
				enterAlbumName: "请输入相簿名称",
				albumNameRequired: "相簿名称是必填的",
				albumNameTooLong: "相簿名称不能超过 50 个字符",
				enterAlbumDescription: "请输入相簿描述 (可选)",
				saveAlbum: "保存相簿",
				saving: "保存中...",
				cancel: "取消",

                // Album Status & Navigation
				albumNotFound: "找不到相簿",
				loadingAlbum: "加载相簿中...",
				noAlbum: "没有相簿",
				noDescription: "没有描述",

                // Album Content Organization
				folders: "文件夹",
				media: "媒体",
				noMediaInAlbum: "此相簿中还没有媒体",
				tapToAdd: "点击 + 按钮来添加照片和视频",

                // Album Actions
				addMediaOrNewFolder: "添加媒体或新文件夹",
				addMedia: "添加媒体",
				addNewFolder: "添加新相簿",
				deleteAlbum: "此相簿將被刪除，包含所有子相簿和媒體項目。",
				
                // Album Navigation & Moving
				moveToAlbum: "移至相簿",
				parentAlbum: "父相簿",
				subAlbums: "子相簿",
				topLevelAlbums: "顶层相簿",
				noSubAlbums: "沒有子相簿",
				noSubAlbumsDescription: "此相簿沒有任何子相簿。您只能將資產移至父相簿。",
				currentAlbum: "当前",
				success: "成功",
				movedTo: "已移至",
				ok: "確定",
				moveAssetsError: "移動資產失敗。請重試。",
				confirm: "確認",
				loading: "載入中...",
				movingTo: "移至",

                //===============================================
                // MEDIA & ASSETS
                //===============================================
                // Media Types
				photo: "照片",
				photos: "照片",
				video: "视频",
				videos: "视频",
				asset: "个项目",
				assets: "个项目",

                // Media Actions
				delete: "删除",
				deleteAsset: "删除項目",
				deletePhoto: "删除照片",
				deleteVideo: "删除视频",
				deletingAssetMessage: "在此删除此资产不会从您的媒体库中移除它。",

                // Media Selection
				item: "项目",
				items: "项目",
				selected: "已选择",

                //===============================================
                // PERMISSIONS & ACCESS
                //===============================================
                // Permission Requests
				checkingPermissions: "检查权限中...",
				mediaAccessRequired: "需要媒体访问权限",
				mediaAccessDescription: "TidBum 需要访问您的照片和视频来帮助您组织和管理媒体库。",
				toEnableAccess: "要启用访问：",

                // Permission Instructions
				tapOpenSettings: "点击下方的「打开设置」",
				findTidBum: "在列表中找到「TidBum」",
				enablePhotosVideos: "启用「照片和视频」",
				openSettings: "打开设置",
				tryAgain: "重试",
				requesting: "请求中...",

                //===============================================
                // MEDIA LIBRARY
                //===============================================
                // Library Interface
				mediaLibrary: "媒体库",
				library: "媒体库",
				noMediaYet: "还没有媒体",
				addPhotosVideos: "添加照片和视频",
				available: "可用",

                //===============================================
                // ALBUM SLIDER & VIEWER
                //===============================================
                // Caption Management
				editCaption: "编辑说明",
				addCaption: "添加说明...",

                //===============================================
                // COVER IMAGE MODAL
                //===============================================
                // Cover Image Selection
				selectedCoverImage: "已选择",
				selectCoverImage: "选择封面图片",
				noPhotosAvailable: "没有可用的照片",
				noPhotosAvailableMessage: "此相簿中没有照片可以设为封面图片。",
				changeCover: "变更封面",
				removeCover: "移除封面",
				setCover: "设置封面",
				noImageSelected: "未选择图片",
				coverImageSelected: "已选择",

                //===============================================
                // SETTINGS & PREFERENCES
                //===============================================
                // Settings Navigation
				setting: "设置",
				language: "语言",
				languageSetting: "选择语言",
				languageSubtitle: "简体中文",

                // Appearance Settings
				appearance: "外观",
				darkMode: "深色模式",
				darkModeSubtitle: "切换深色和浅色主题",

                // Help & Support
				helpSupport: "帮助与支持",
				helpCenter: "帮助中心",
				helpCenterSubtitle: "获取使用帮助和支持",
				faq: "常见问题",
				faqSubtitle: "查看常见问题解答",

                // Legal & Terms
				legal: "法律条款",
				termsOfUse: "使用条款",
				termsOfUseSubtitle: "阅读应用程序使用条款",
				privacyPolicy: "隐私政策",
				privacyPolicySubtitle: "了解我们的隐私政策",

                // App Information
				version: "版本 1.0.0",
				copyright: "© " + new Date().getFullYear() + " TidBum",

                //===============================================
                // ERROR MESSAGES & ALERTS
                //===============================================
                // General Errors
				error: "错误",

                // Operation Failures
				failedToUpdateLanguage: "无法更新语言。请重试。",
				failedToCreateAlbum: "无法创建相簿。请重试。",
				failedToSaveAlbum: "无法保存相簿。请重试。",

                // External Link Failures
				cannotOpenHelpCenter: "无法打开帮助中心",
				cannotOpenFAQ: "无法打开常见问题",
				cannotOpenTerms: "无法打开使用条款",
				cannotOpenPolicy: "无法打开隐私政策",
			};
		case Language.EN:
		default:
			return {
                //===============================================
                // APP
                //===============================================
                appName: "Tidbum",
                back: "Back",

                //===============================================
                // ALBUM MANAGEMENT
                //===============================================
                // Album Creation & Editing
				createAlbum: "Create Album",
				createAlbumSubtitle: "Organize your photos and videos into beautiful albums",
				editAlbum: "Edit Album",
				updateAlbumDetails: "Update your album details",
				albumName: "Album Name",
				enterAlbumName: "Enter album name",
				albumNameRequired: "Album name is required",
				albumNameTooLong: "Album name cannot be more than 50 characters",
				enterAlbumDescription: "Add a description (optional)",
				saveAlbum: "Save Album",
				saving: "Saving...",
				cancel: "Cancel",

                // Album Status & Navigation
				albumNotFound: "Album not found",
				loadingAlbum: "Loading album...",
				noAlbum: "No album",
				noDescription: "No description",

                // Album Content Organization
				folders: "Folders",
				media: "Media",
				noMediaInAlbum: "No media in this album yet",
				tapToAdd: "Tap the + button to add photos and videos",

                // Album Actions
				addMediaOrNewFolder: "Add media or a new folder",
				addMedia: "Add media",
				addNewFolder: "Add a new album",
				deleteAlbum: "This album will be deleted, including all sub-albums and media items.",
				
                // Album Navigation & Moving
				moveToAlbum: "Move to Album",
				parentAlbum: "Parent Album",
				subAlbums: "Sub-Albums",
				topLevelAlbums: "Top-Level Albums",
				noSubAlbums: "No Sub-Albums",
				noSubAlbumsDescription: "This album doesn't have any sub-albums. You can only move assets to the parent album.",
				currentAlbum: "Current",
				success: "Success",
				movedTo: "moved to",
				ok: "OK",
				moveAssetsError: "Failed to move assets. Please try again.",
				confirm: "Confirm",
				loading: "Loading...",
				movingTo: "Moving to",

                //===============================================
                // MEDIA & ASSETS
                //===============================================
                // Media Types
				photo: "photo",
				photos: "photos",
				video: "video",
				videos: "videos",
				asset: "asset",
				assets: "assets",

                // Media Actions
				delete: "Delete",
				deleteAsset: "Delete Asset",
				deletePhoto: "Delete Photo",
				deleteVideo: "Delete Video",
				deletingAssetMessage: "Deleting this asset here won't remove it from your media library.",

                // Media Selection
				item: "item",
				items: "items",
				selected: "selected",

                //===============================================
                // PERMISSIONS & ACCESS
                //===============================================
                // Permission Requests
				checkingPermissions: "Checking permissions...",
				mediaAccessRequired: "Media Access Required",
				mediaAccessDescription: "TidBum needs access to your photos and videos to help you organize and manage your media library.",
				toEnableAccess: "To enable access:",

                // Permission Instructions
				tapOpenSettings: "Tap \"Open Settings\" below",
				findTidBum: "Find \"TidBum\" in the list",
				enablePhotosVideos: "Enable \"Photos and Videos\"",
				openSettings: "Open Settings",
				tryAgain: "Try Again",
				requesting: "Requesting...",

                //===============================================
                // MEDIA LIBRARY
                //===============================================
                // Library Interface
				mediaLibrary: "Media Library",
				library: "Library",
				noMediaYet: "No media yet",
				addPhotosVideos: "Add photos and videos",
				available: "available",

                //===============================================
                // ALBUM SLIDER & VIEWER
                //===============================================
                // Caption Management
				editCaption: "Edit Caption",
				addCaption: "Add a caption...",

                //===============================================
                // COVER IMAGE MODAL
                //===============================================
                // Cover Image Selection
				selectedCoverImage: "Selected",
				selectCoverImage: "Select Cover Image",
				noPhotosAvailable: "No photos available",
				noPhotosAvailableMessage: "There are no photos in this album to set as the cover image.",
				changeCover: "Change Cover",
				removeCover: "Remove Cover",
				setCover: "Set Cover",
				noImageSelected: "No image selected",
				coverImageSelected: "Selected",

                //===============================================
                // SETTINGS & PREFERENCES
                //===============================================
                // Settings Navigation
				setting: "Setting",
				language: "Language",	
				languageSetting: "Select Language",
				languageSubtitle: "English",

                // Appearance Settings
				appearance: "Appearance",
				darkMode: "Dark Mode",
				darkModeSubtitle: "Switch between dark and light themes",

                // Help & Support
				helpSupport: "Help & Support",
				helpCenter: "Help Center",
				helpCenterSubtitle: "Get help and support",
				faq: "FAQ",
				faqSubtitle: "View frequently asked questions",

                // Legal & Terms
				legal: "Legal",
				termsOfUse: "Terms of Use",
				termsOfUseSubtitle: "Read app terms of use",
				privacyPolicy: "Privacy Policy",
				privacyPolicySubtitle: "Learn about our privacy policy",

                // App Information
				version: "Version 1.0.0",
				copyright: "© " + new Date().getFullYear() + " TidBum",

                //===============================================
                // ERROR MESSAGES & ALERTS
                //===============================================
                // General Errors
				error: "Error",

                // Operation Failures
				failedToUpdateLanguage: "Failed to update language. Please try again.",
				failedToCreateAlbum: "Failed to create album. Please try again.",
				failedToSaveAlbum: "Failed to save album. Please try again.",

                // External Link Failures
				cannotOpenHelpCenter: "Cannot open help center",
				cannotOpenFAQ: "Cannot open FAQ",
				cannotOpenTerms: "Cannot open terms of use",
				cannotOpenPolicy: "Cannot open privacy policy",
			};
	}
};