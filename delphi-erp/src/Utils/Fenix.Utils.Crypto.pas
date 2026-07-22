unit Fenix.Utils.Crypto;

interface

uses
  System.SysUtils,
  System.Hash;

type
  TCryptoUtils = class
  public
    class function GenerateSalt: string; static;
    class function HashPassword(const APassword, ASalt, APepper: string): string; static;
    class function GenerateSessionToken: string; static;
  end;

implementation

class function TCryptoUtils.GenerateSalt: string;
var
  LSeed: string;
begin
  LSeed := FormatDateTime('yyyymmddhhnnsszzz', Now) + IntToStr(Random(MaxInt));
  Result := THashSHA2.GetHashString(LSeed, SHA256);
end;

class function TCryptoUtils.HashPassword(const APassword, ASalt, APepper: string): string;
begin
  Result := THashSHA2.GetHashString(APassword + '|' + ASalt + '|' + APepper, SHA512);
end;

class function TCryptoUtils.GenerateSessionToken: string;
begin
  Result := THashSHA2.GetHashString(GenerateSalt + '|SESSION|' + IntToStr(Random(MaxInt)), SHA256);
end;

end.
