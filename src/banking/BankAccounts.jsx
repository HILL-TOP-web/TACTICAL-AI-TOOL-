import React, { useState } from "react";

export default function BankAccounts({
  accounts = [],
  onAddAccount,
  onRemoveAccount,
  onSetDefault,
}) {
  const [showForm, setShowForm] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const cleanName = accountName.trim();
    const cleanNumber = accountNumber.trim();
    const cleanBank = bankName.trim();

    if (!cleanName || !cleanNumber || !cleanBank) {
      setMessage("Complete all bank account fields.");
      return;
    }

    if (typeof onAddAccount !== "function") {
      setMessage(
        "Bank account service is not connected."
      );
      return;
    }

    try {
      await onAddAccount({
        accountName: cleanName,
        accountNumber: cleanNumber,
        bankName: cleanBank,
      });

      setAccountName("");
      setAccountNumber("");
      setBankName("");
      setShowForm(false);
      setMessage("Bank account added.");
    } catch (error) {
      setMessage(
        error?.message ||
          "Unable to add bank account."
      );
    }
  };

  return (
    <section className="bank-accounts">
      <header className="bank-accounts__header">
        <div>
          <h2>Bank Accounts</h2>
          <p>
            Manage verified accounts used for payouts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
        >
          {showForm ? "Cancel" : "Add Account"}
        </button>
      </header>

      {showForm && (
        <form
          className="bank-accounts__form"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="bank-name">
              Bank Name
            </label>

            <input
              id="bank-name"
              type="text"
              value={bankName}
              onChange={(event) =>
                setBankName(event.target.value)
              }
              placeholder="Bank name"
            />
          </div>

          <div>
            <label htmlFor="account-name">
              Account Name
            </label>

            <input
              id="account-name"
              type="text"
              value={accountName}
              onChange={(event) =>
                setAccountName(event.target.value)
              }
              placeholder="Account holder name"
            />
          </div>

          <div>
            <label htmlFor="account-number">
              Account Number
            </label>

            <input
              id="account-number"
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(event) =>
                setAccountNumber(event.target.value)
              }
              placeholder="Account number"
            />
          </div>

          <button type="submit">
            Save Bank Account
          </button>
        </form>
      )}

      {message && (
        <div
          className="bank-accounts__message"
          role="status"
        >
          {message}
        </div>
      )}

      <div className="bank-accounts__list">
        {accounts.length === 0 ? (
          <div className="bank-accounts__empty">
            No bank accounts have been added.
          </div>
        ) : (
          accounts.map((account, index) => (
            <article
              key={
                account.id ||
                account.accountId ||
                index
              }
              className="bank-accounts__item"
            >
              <div>
                <strong>
                  {account.bankName}
                </strong>

                <span>
                  {account.accountName}
                </span>

                <span>
                  ••••{" "}
                  {String(
                    account.accountNumber || ""
                  ).slice(-4)}
                </span>
              </div>

              <div className="bank-accounts__actions">
                {account.isDefault ? (
                  <span>Default</span>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onSetDefault?.(
                        account.id ||
                          account.accountId
                      )
                    }
                  >
                    Set Default
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    onRemoveAccount?.(
                      account.id ||
                        account.accountId
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
                }
