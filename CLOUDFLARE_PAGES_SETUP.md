# Cloudflare Pages + Worker/KV setup

Huong nay giup tao link quiz ma khong production deploy moi lan. App duoc deploy len Cloudflare Pages mot lan, con tung quiz moi se duoc luu vao Cloudflare KV qua Pages Function.

## 1. Tao KV namespace

1. Vao Cloudflare Dashboard.
2. Mo `Workers & Pages`.
3. Mo `KV`.
4. Bam `Create namespace`.
5. Dat ten, vi du `atticus_quiz_kv`.

## 2. Tao Pages project

1. Vao `Workers & Pages` -> `Create application`.
2. Chon `Pages` -> `Connect to Git`.
3. Chon repo cua app nay.
4. Cau hinh build:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Deploy lan dau.

## 3. Gan KV binding cho Pages

1. Vao Pages project vua tao.
2. Mo `Settings` -> `Bindings` -> `Add` -> `KV namespace`.
3. Them binding:
   - Variable name: `QUIZ_KV`
   - KV namespace: namespace vua tao, vi du `atticus_quiz_kv`
4. Luu cau hinh.

## 4. Them bien moi truong

Trong Pages project, vao `Settings` -> `Environment variables`, them:

```env
CLOUDFLARE_PUBLISH_TOKEN=dat_mot_chuoi_bi_mat_dai
PUBLIC_BASE_URL=https://ten-pages-cua-ban.pages.dev
```

`CLOUDFLARE_PUBLISH_TOKEN` la mat khau de app duoc phep ghi quiz vao KV. Khong chia se token nay cho hoc sinh/ban be. `PUBLIC_BASE_URL` khong bat buoc, nhung nen dat neu ban dung custom domain.

Neu Cloudflare dang build ra asset co duong dan `/atticus-quiz/assets/...`, them bien build sau roi deploy lai:

```env
VITE_BASE_PATH=/
```

Ban code moi cung tu nhan dien moi truong Cloudflare Pages qua `CF_PAGES` va tu dung base `/`, nhung bien `VITE_BASE_PATH=/` van la cach sua nhanh neu project da deploy bang cau hinh cu.

Sau khi them bien moi truong hoac binding, hay deploy lai Pages project mot lan.

## 5. Dung trong app

1. Mo app tren Cloudflare Pages.
2. Mo `Create Link settings`.
3. Nhap `Publish token` giong bien `CLOUDFLARE_PUBLISH_TOKEN`.
4. Neu muon link co ten co dinh, nhap `Link slug`, vi du `sinh-11-hk2-phan-2`.
5. Tao/nhap quiz nhu binh thuong.
6. Bam `Create Link`.

Ket qua se co dang:

```text
https://ten-pages-cua-ban.pages.dev/q/sinh-11-hk2-phan-2
```

Neu de trong `Link slug`, app se tu tao slug theo ten quiz kem hau to thoi gian de tranh trung.

## Ghi chu

- Moi lan bam `Create Link` chi ghi HTML vao KV, khong can deploy production moi.
- Neu nhap cung mot `Link slug`, quiz cu tai slug do se duoc cap nhat bang noi dung moi.
- File HTML qua lon se bi chan o muc 20 MB de tranh vuot gioi han KV.
- Khi chay local bang `npm run dev`, Pages Functions khong chay. De test full local, dung Cloudflare Pages sau khi deploy, hoac cai Wrangler va chay Pages dev.
- Khong nen nhung `CLOUDFLARE_PUBLISH_TOKEN` vao frontend lam mac dinh cong khai. Token duoc nhap mot lan trong app va luu vao `localStorage` cua trinh duyet ban dang dung.
