// TypeScript declarations for Google Identity Services
// https://developers.google.com/identity/gsi/web/reference/js-reference

interface CredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;

  renderButton(
    parent: HTMLElement | null,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      type?: 'standard' | 'icon';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      logo_alignment?: 'left' | 'center';
      width?: number;
      locale?: string;
    }
  ): void;

  prompt(): void;
  cancel(): void;
  disableAutoSelect(): void;
  revoke(hint: string, callback: () => void): void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

interface Window {
  google: {
    accounts: GoogleAccounts;
  };
}
