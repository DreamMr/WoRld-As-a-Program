# *WoRld-As-a-Program*

*Coming soon.*

# WRAP 项目网站

直接在浏览器打开 `index.html` 即可预览。网站使用静态 HTML、CSS 和 JavaScript，无需安装依赖或构建。

## 部署到 GitHub Pages

1. 将 `index.html`、`assets/`、`logo.png`、两段 `.mp4` 和 `.nojekyll` 提交到网站仓库的 `main` 分支根目录。`rgb_point/` 中的源文件用于更新点云，网页使用 `assets/` 中已打包的点云数据。
2. 在仓库的 **Settings → Pages** 中，将发布来源设为 **Deploy from a branch**，选择 `main` 和 `/(root)`，然后保存。若团队已有网站仓库，也可以将这些文件放到该分支的 `docs/` 目录并选择 `/docs`。

页面和资源均使用相对路径，兼容 `https://<owner>.github.io/<repo>/`。

## 更新页面

- 公开地址确定后，在 `index.html` 的 `.hero-resources` 中将对应的占位按钮替换为带 `href` 的 `<a class="resource-button">`。
- Spatial reasoning 的任务、推理和结果分别在 `#reasoning-task`、`#reasoning-steps` 和 `#reasoning-result` 中修改。Scene editing 的任务和推理分别在 `#editing-task` 和 `#editing-steps` 中修改。
- 两段视频各有独立的帧浏览器。可以拖动时间轴，或点击视频后滚动浏览。视频获得焦点时，左右方向键可以逐帧切换。替换视频时同步更新对应 `.frame-player` 的 `data-fps`、`data-frames` 和时间轴上限。
- 3D 查看器支持旋转、缩放和同时勾选多个物体。`Fit selection` 将当前勾选的点云移入视野，`Reset view` 恢复全场景视角。更新 `rgb_point/` 中的 XYZ/RGB 二进制小端 `.ply` 文件后，在本目录运行 `python3 tools/build-point-cloud.py` 并提交重新生成的 `assets/demo-points.js`。打包后的数据也可通过直接打开本地页面加载。
- 标注帧放在 `assets/marked-frames/`，文件名使用帧编号。浏览范围由 `index.html` 中 `#marked-frame-list` 的 `start` 和 `data-last` 设置，包含起止帧。
- 方法和结果文案也在 `index.html` 中。首屏使用 `logo.png`。
