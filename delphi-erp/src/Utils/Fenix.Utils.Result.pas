unit Fenix.Utils.Result;

interface

type
  TOperationResult = record
  private
    FSuccess: Boolean;
    FMessage: string;
  public
    class function Ok(const AMessage: string = ''): TOperationResult; static;
    class function Fail(const AMessage: string): TOperationResult; static;
    property Success: Boolean read FSuccess;
    property Message: string read FMessage;
  end;

implementation

class function TOperationResult.Ok(const AMessage: string): TOperationResult;
begin
  Result.FSuccess := True;
  Result.FMessage := AMessage;
end;

class function TOperationResult.Fail(const AMessage: string): TOperationResult;
begin
  Result.FSuccess := False;
  Result.FMessage := AMessage;
end;

end.
