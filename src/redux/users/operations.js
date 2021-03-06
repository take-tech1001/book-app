import { signInAction, signOutAction } from "./actions";
import Router from "next/router";
import { auth, db, FirebaseTimestamp } from "../../firebase/index";

export const listenAuthState = () => {
  return async (dispatch) => {
    return auth.onAuthStateChanged((user) => {
      // 現在ログインしているユーザーを取得
      if (user) {
        const uid = user.uid;
        // DBからユーザーの情報を取得
        db.collection("users")
          .doc(uid)
          .get()
          .then((snapshot) => {
            const data = snapshot.data();

            // actionsのsignInActionのstateを変更
            dispatch(
              signInAction({
                isSignedIn: true,
                role: data.role,
                uid: uid,
                username: data.username,
              })
            );
          });
      } else {
        // ユーザーが存在していない場合
        Router.push("/signin");
      }
    });
  };
};

export const signIn = (email, password) => {
  return async (dispatch) => {
    if (email === "" || password === "") {
      alert("必須項目が未入力です");
      return false;
    }

    auth
      .signInWithEmailAndPassword(email, password)
      .then((result) => {
        const user = result.user;

        if (user) {
          const uid = user.uid;
          db.collection("users")
            .doc(uid)
            .get()
            .then((snapshot) => {
              const data = snapshot.data();

              dispatch(
                signInAction({
                  isSignedIn: true,
                  uid: uid,
                  role: data.role,
                  username: data.username,
                })
              );
              Router.push("/");
            });
        }
      })
      .catch(() => {
        alert("メールアドレスもしくはパスワードが正しくありません");
        return false;
      });
  };
};

export const signUp = (username, email, password, confirmPassword) => {
  return async () => {
    if (
      username === "" ||
      email === "" ||
      password === "" ||
      confirmPassword === ""
    ) {
      alert("必須項目が未入力です");
      return false;
    }

    if (password.length < 6) {
      alert("パスワードは６文字以上で入力してください");
      return false;
    }

    if (password !== confirmPassword) {
      alert("パスワードが一致していません");
      return false;
    }
    return auth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        const user = result.user;

        if (user) {
          const uid = user.uid;
          const timestamp = FirebaseTimestamp.now();

          const userInitalData = {
            create_at: timestamp,
            email: email,
            role: "customer",
            uid: uid,
            updated_at: timestamp,
            username: username,
          };

          db.collection("users")
            .doc(uid)
            .set(userInitalData)
            .then(() => {
              Router.push("/");
            });
        }
      });
  };
};

export const signOut = () => {
  return async (dispatch) => {
    auth.signOut().then(() => {
      dispatch(signOutAction());
      Router.push("/signin");
    });
  };
};

export const resetPassword = (email) => {
  return async () => {
    if (email === "") {
      alert("必須項目が未入力です");
      return false;
    } else {
      return auth
        .sendPasswordResetEmail(email)
        .then(() => {
          alert(
            "入力されたアドレス宛にパスワードリセットのメールをお送りしましたのでご確認ください。"
          );
          Router.push("/signin");
        })
        .catch(() => {
          alert("登録されていないメールアドレスです。もう一度ご確認ください。");
        });
    }
  };
};

// export const updateBooks = (user) => {
//   return async (dispatch) => {
//     db.collection("users")
//       .doc(user)
//       .collection("books")
//       .get()
//       .then((snapshots) => {
//         let items = [];
//         snapshots.forEach((snapshot) => {
//           items.push(snapshot.data());
//         });
//         const unread = items.filter((item) => {
//           return item.progress === "unread";
//         });
//         const read = items.filter((item) => {
//           return item.progress === "read";
//         });
//         dispatch(
//           booksUpdateAction([
//             {
//               unread: unread,
//               read: read,
//             },
//           ])
//         );
//       });
//   };
// };
